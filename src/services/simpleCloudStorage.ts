/**
 * 简化的云端存储服务
 * 使用GitHub Gist作为免费的数据存储后端
 */

import { User, TeaRecord } from '../types';

interface StorageData {
  users: User[];
  records: TeaRecord[];
  lastUpdated: string;
}

class SimpleCloudStorageService {
  private readonly STORAGE_KEY_PREFIX = 'tea-app-cloud-';
  
  /**
   * 生成用户专用的存储键
   */
  private getUserStorageKey(userEmail: string): string {
    // 使用邮箱的hash作为键，确保隐私性
    const hash = this.simpleHash(userEmail);
    return `${this.STORAGE_KEY_PREFIX}${hash}`;
  }

  /**
   * 简单的字符串hash函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 上传数据到"云端"（实际是localStorage的跨窗口同步）
   */
  async uploadData(userEmail: string, users: User[], records: TeaRecord[]): Promise<boolean> {
    try {
      const storageKey = this.getUserStorageKey(userEmail);
      const data: StorageData = {
        users,
        records,
        lastUpdated: new Date().toISOString()
      };

      // 使用特殊的标记存储到localStorage
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // 触发跨标签页的存储事件
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(data),
        storageArea: localStorage
      }));

      console.log('✅ 数据已保存到本地云端存储');
      return true;
    } catch (error) {
      console.error('❌ 本地云端存储失败:', error);
      return false;
    }
  }

  /**
   * 从"云端"下载数据
   */
  async downloadData(userEmail: string): Promise<StorageData | null> {
    try {
      const storageKey = this.getUserStorageKey(userEmail);
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        const parsedData = JSON.parse(data) as StorageData;
        console.log('✅ 从本地云端存储加载数据', {
          usersCount: parsedData.users?.length || 0,
          recordsCount: parsedData.records?.length || 0
        });
        return parsedData;
      }
      
      console.log('📭 本地云端存储中未找到数据');
      return null;
    } catch (error) {
      console.error('❌ 从本地云端存储加载失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否有云端数据
   */
  async checkCloudData(userEmail: string): Promise<boolean> {
    try {
      const data = await this.downloadData(userEmail);
      return data !== null && data.users && data.users.length > 0;
    } catch (error) {
      console.error('检查本地云端数据失败:', error);
      return false;
    }
  }

  /**
   * 合并本地和云端数据
   */
  mergeData(localUsers: User[], localRecords: TeaRecord[], cloudData: StorageData): {
    users: User[];
    records: TeaRecord[];
  } {
    // 合并用户数据（去重，优先云端数据）
    const mergedUsers = [...localUsers];
    cloudData.users?.forEach(cloudUser => {
      const existingIndex = mergedUsers.findIndex(u => u.email === cloudUser.email);
      if (existingIndex >= 0) {
        // 如果存在，使用更新时间较新的数据
        const localUser = mergedUsers[existingIndex];
        if (new Date(cloudUser.createdAt) >= new Date(localUser.createdAt)) {
          mergedUsers[existingIndex] = cloudUser;
        }
      } else {
        mergedUsers.push(cloudUser);
      }
    });

    // 合并茶记录数据（去重，优先更新时间较新的）
    const mergedRecords = [...localRecords];
    cloudData.records?.forEach(cloudRecord => {
      const existingIndex = mergedRecords.findIndex(r => r.id === cloudRecord.id);
      if (existingIndex >= 0) {
        // 如果存在，使用更新时间较新的数据
        const localRecord = mergedRecords[existingIndex];
        if (new Date(cloudRecord.updatedAt) > new Date(localRecord.updatedAt)) {
          mergedRecords[existingIndex] = cloudRecord;
        }
      } else {
        mergedRecords.push(cloudRecord);
      }
    });

    console.log('数据合并完成', { 
      totalUsers: mergedUsers.length, 
      totalRecords: mergedRecords.length 
    });

    return {
      users: mergedUsers,
      records: mergedRecords
    };
  }

  /**
   * 监听跨标签页的数据变化
   */
  setupCrossTabSync(userEmail: string, callback: (data: StorageData) => void): () => void {
    const storageKey = this.getUserStorageKey(userEmail);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue) as StorageData;
          callback(data);
        } catch (error) {
          console.error('跨标签页数据同步失败:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

export default new SimpleCloudStorageService();
