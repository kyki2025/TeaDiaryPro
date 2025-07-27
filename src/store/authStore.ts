/**
 * 用户认证状态管理store
 * 处理用户登录、注册、登出等认证相关操作，支持云端数据同步
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import simpleCloudStorage from '../services/simpleCloudStorage';
import { DiagnosticTool } from '../utils/diagnostics';

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string): Promise<boolean> => {
        try {
          console.log('🔐 开始登录流程...', { email });
          
          // 生成诊断报告
          DiagnosticTool.generateReport(email);
          
          // 测试云端连接
          const cloudTest = await DiagnosticTool.testCloudConnection();
          console.log('☁️ 云端连接测试:', cloudTest);
          
          // 先检查本地数据
          let users: User[] = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
          let user = users.find(u => u.email === email && u.password === password);
          
          if (user) {
            console.log('✅ 本地登录成功');
            set({ user, isAuthenticated: true });
            return true;
          }
          
          // 本地未找到，尝试从云端加载
          console.log('🌐 本地未找到用户，尝试从云端加载...');
          
          if (!cloudTest.success) {
            console.warn('⚠️ 云端连接失败，跳过云端同步:', cloudTest.error);
            return false;
          }
          
          try {
            const cloudData = await simpleCloudStorage.downloadData(email);
            
            if (cloudData && cloudData.users && cloudData.users.length > 0) {
              console.log('📥 找到云端数据，正在验证...', {
                usersCount: cloudData.users.length,
                recordsCount: cloudData.records?.length || 0
              });
              
              const cloudUser = cloudData.users.find(u => u.email === email && u.password === password);
              if (cloudUser) {
                console.log('✅ 云端登录验证成功，同步数据到本地...');
                
                // 合并云端数据到本地
                const localRecords = JSON.parse(localStorage.getItem('tea-app-records') || '[]');
                const merged = simpleCloudStorage.mergeData(users, localRecords, cloudData);
                
                // 保存合并后的数据到本地
                localStorage.setItem('tea-app-users', JSON.stringify(merged.users));
                localStorage.setItem('tea-app-records', JSON.stringify(merged.records));
                
                user = cloudUser;
                console.log('🎉 云端数据已成功同步到本地');
                set({ user, isAuthenticated: true });
                return true;
              } else {
                console.log('❌ 云端找到用户数据但密码不匹配');
                // 列出云端找到的用户邮箱（不显示密码）
                const foundEmails = cloudData.users.map(u => u.email);
                console.log('云端用户列表:', foundEmails);
              }
            } else {
              console.log('📭 云端未找到用户数据');
            }
          } catch (cloudError) {
            console.error('☁️ 云端数据加载失败:', cloudError);
          }
          
          console.log('❌ 登录失败：用户不存在或密码错误');
          // 生成失败后的诊断报告
          DiagnosticTool.generateReport(email);
          return false;
          
        } catch (error) {
          console.error('💥 登录过程发生错误:', error);
          DiagnosticTool.generateReport(email);
          return false;
        }
      },

      register: async (username: string, email: string, password: string): Promise<boolean> => {
        try {
          console.log('📝 开始注册流程...', { username, email });
          
          let users: User[] = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
          
          // 检查本地邮箱是否已存在
          if (users.find(u => u.email === email)) {
            console.log('❌ 邮箱已在本地注册');
            return false;
          }

          // 检查云端是否已存在
          console.log('🌐 检查云端是否已有此邮箱...');
          try {
            const hasCloudData = await simpleCloudStorage.checkCloudData(email);
            if (hasCloudData) {
              console.log('❌ 邮箱已在云端注册');
              return false;
            }
          } catch (cloudError) {
            console.log('⚠️ 云端检查失败，继续本地注册:', cloudError);
          }

          const newUser: User = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          localStorage.setItem('tea-app-users', JSON.stringify(users));
          console.log('✅ 用户已保存到本地');
          
          // 同步到云端
          console.log('☁️ 正在同步到云端...');
          try {
            const records = JSON.parse(localStorage.getItem('tea-app-records') || '[]');
            const uploadSuccess = await simpleCloudStorage.uploadData(email, users, records);
            if (uploadSuccess) {
              console.log('🎉 新用户数据已成功同步到云端');
            } else {
              console.log('⚠️ 云端同步失败，但本地注册成功');
            }
          } catch (uploadError) {
            console.error('☁️ 云端同步出错:', uploadError);
          }
          
          set({ user: newUser, isAuthenticated: true });
          console.log('🎉 注册完成！');
          return true;
        } catch (error) {
          console.error('💥 注册过程发生错误:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'tea-app-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
