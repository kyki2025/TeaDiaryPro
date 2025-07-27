/**
 * 同步状态显示组件
 * 展示最后同步时间和当前同步状态
 */

import React from 'react';
import { Check, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import useAutoSync from '../../hooks/useAutoSync';

const SyncStatus: React.FC = () => {
  const { lastSyncTime, syncStatus, needsSync } = useAutoSync({
    enableAutoSync: true,
    syncInterval: 30 // 30分钟自动同步一次
  });

  /**
   * 获取状态图标和颜色
   */
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: '同步中...',
          color: 'text-blue-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: '同步失败',
          color: 'text-red-600'
        };
      case 'success':
        return {
          icon: <Check className="w-4 h-4" />,
          text: needsSync ? '需要同步' : '已同步',
          color: needsSync ? 'text-orange-600' : 'text-green-600'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: '待同步',
          color: 'text-gray-600'
        };
    }
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
    return date.toLocaleDateString();
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`flex items-center space-x-1 ${statusDisplay.color}`}>
        {statusDisplay.icon}
        <span>{statusDisplay.text}</span>
      </div>
      {lastSyncTime && (
        <span className="text-gray-500">
          {formatTime(lastSyncTime)}
        </span>
      )}
    </div>
  );
};

export default SyncStatus;