/**
 * 用户登录表单组件
 * 提供邮箱密码登录功能
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import useAuthStore from '../../store/authStore';
import { Mail, Lock, LogIn, Eye, EyeOff, Cloud, Bug, RefreshCw } from 'lucide-react';
import { DiagnosticTool } from '../../utils/diagnostics';
import DataSync from '../sync/DataSync';
import { User, TeaRecord } from '../../types';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDataSync, setShowDataSync] = useState(false);
  
  const login = useAuthStore(state => state.login);

  /**
   * 处理登录表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('请填写所有字段');
      setLoading(false);
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('邮箱或密码错误，请检查输入信息');
    }
    setLoading(false);
  };

  /**
   * 处理数据导入
   */
  const handleDataImported = (users: User[], records: TeaRecord[]) => {
    try {
      // 保存导入的数据到本地
      localStorage.setItem('tea-app-users', JSON.stringify(users));
      localStorage.setItem('tea-app-records', JSON.stringify(records));
      
      console.log('✅ 数据导入成功', { 
        usersCount: users.length, 
        recordsCount: records.length 
      });
      
      // 刷新调试信息
      if (debugMode) {
        const report = DiagnosticTool.generateReport(email);
        setDebugInfo(report);
      }
      
      setShowDataSync(false);
    } catch (error) {
      console.error('💥 数据导入失败:', error);
      alert('数据导入失败，请重试');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-emerald-700">茶记</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDebugMode(!debugMode);
              if (!debugMode) {
                const report = DiagnosticTool.generateReport(email);
                setDebugInfo(report);
              }
            }}
            className="opacity-50 hover:opacity-100"
          >
            <Bug className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>登录您的茶叶记录账户</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-700 font-medium mb-1">
                跨设备数据同步
              </p>
              <p className="text-xs text-emerald-600 mb-2">
                如果您在其他设备上有茶记录数据，请点击同步按钮导入数据。
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDataSync(true)}
                className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                同步数据
              </Button>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {debugMode && (
            <div className="bg-gray-50 border rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">调试信息</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const report = DiagnosticTool.generateReport(email);
                    const cloudTest = await DiagnosticTool.testCloudConnection();
                    setDebugInfo(report + '\n\n☁️ 云端测试: ' + JSON.stringify(cloudTest, null, 2));
                  }}
                  className="h-6 px-2"
                >
                  刷新
                </Button>
              </div>
              <pre className="text-gray-600 whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
                {debugInfo}
              </pre>
              {debugInfo.includes('用户数量: 0') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // 创建测试用户
                    const testUser = {
                      id: Date.now().toString(),
                      username: '测试用户',
                      email: email || 'yunhairichu@gmail.com',
                      password: password || 'chuncha00008',
                      createdAt: new Date().toISOString(),
                    };
                    
                    const users = [testUser];
                    localStorage.setItem('tea-app-users', JSON.stringify(users));
                    
                    // 创建一些示例茶记录
                    const sampleRecords = [
                      {
                        id: '1',
                        userId: testUser.id,
                        date: '2025-01-26',
                        teaName: '霍山黄芽',
                        teaType: '黄茶',
                        origin: '安徽霍山',
                        brewingMethod: '盖碗冲泡',
                        temperature: 95,
                        brewingTime: '30秒',
                        rating: 5,
                        appearance: '条索紧结',
                        aroma: '香气馥郁',
                        taste: '口感饱满，甘润',
                        aftertaste: '回甘持久',
                        notes: '品质很好的黄茶',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }
                    ];
                    localStorage.setItem('tea-app-records', JSON.stringify(sampleRecords));
                    
                    alert('✅ 测试数据已创建！现在可以登录了。');
                    
                    // 刷新调试信息
                    const report = DiagnosticTool.generateReport(email);
                    setDebugInfo(report);
                  }}
                  className="mt-2 w-full"
                >
                  🧪 创建测试数据
                </Button>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                登录中...
              </div>
            ) : (
              <div className="flex items-center">
                <LogIn className="w-4 h-4 mr-2" />
                登录
              </div>
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToRegister}
              className="text-emerald-600 hover:text-emerald-700"
            >
              还没有账户？立即注册
            </Button>
          </div>
        </form>
      </CardContent>
      
      {showDataSync && (
        <DataSync
          onDataImported={handleDataImported}
          onClose={() => setShowDataSync(false)}
        />
      )}
    </Card>
  );
};

export default LoginForm;
