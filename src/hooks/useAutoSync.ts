/**
 * 自动数据同步Hook
 * 提供登录时自动同步和定期自动同步功能
 */

import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useTeaRecordStore from '../store/teaRecordStore';

interface AutoSyncOptions {
  enableAutoSync: boolean;
  syncInterval: number; // 分钟为单位
}

const useAutoSync = (options: AutoSyncOptions = { enableAutoSync: true, syncInterval: 30 }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { loadRecords } = useTeaRecordStore();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  /**
   * 检测是否需要同步数据
   */
  const needsSync = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const lastSync = localStorage.getItem(`last-sync-${user.id}`);
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);
    
    return diffMinutes > options.syncInterval;
  };

  /**
   * 自动同步数据
   */
  const performAutoSync = async (): Promise<void> => {
    if (!isAuthenticated || !user) return;
    
    setSyncStatus('syncing');
    
    try {
      // 模拟云端同步（这里可以替换为真实的云端API）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新加载本地记录
      loadRecords();
      
      // 更新最后同步时间
      const now = new Date();
      localStorage.setItem(`last-sync-${user.id}`, now.toISOString());
      setLastSyncTime(now);
      
      setSyncStatus('success');
      console.log('✅ 自动同步完成');
      
    } catch (error) {
      console.error('❌ 自动同步失败:', error);
      setSyncStatus('error');
    }
  };

  /**
   * 登录时自动同步
   */
  useEffect(() => {
    if (isAuthenticated && user && options.enableAutoSync) {
      if (needsSync()) {
        console.log('🔄 检测到需要同步，开始自动同步...');
        performAutoSync();
      } else {
        // 获取上次同步时间
        const lastSync = localStorage.getItem(`last-sync-${user.id}`);
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      }
    }
  }, [isAuthenticated, user]);

  /**
   * 定期自动同步
   */
  useEffect(() => {
    if (!options.enableAutoSync || !isAuthenticated || !user) return;

    const interval = setInterval(() => {
      if (needsSync()) {
        console.log('⏰ 定期自动同步触发');
        performAutoSync();
      }
    }, options.syncInterval * 60 * 1000); // 转换为毫秒

    return () => clearInterval(interval);
  }, [isAuthenticated, user, options.enableAutoSync, options.syncInterval]);

  return {
    lastSyncTime,
    syncStatus,
    performAutoSync,
    needsSync: needsSync()
  };
};

export default useAutoSync;