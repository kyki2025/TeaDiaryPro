/**
 * 云端存储服务
 * 使用JSONBin.io作为免费的云端存储后端
 */

import axios from 'axios';
import { User, TeaRecord } from '../types';

const API_BASE = 'https://api.jsonbin.io/v3';
const API_KEY = '$2a$10$Vk8rRZc8wXjK9qT5nL2mN.8ZuVhGxYpQ4wK2sR7tL3mX9nV6oP1C2'; // JSONBin.io API密钥

interface CloudData {
  users: User[];
  records: TeaRecord[];
  lastUpdated: string;
}

class CloudStorageService {
  private binId: string | null = null;
  private userBinCache: Map<string, string> = new Map(); // 缓存用户的binId

  /**
   * 初始化用户的云端存储bin
   */
  private async initUserBin(userEmail: string): Promise<string> {
    try {
      const binName = `tea-app-${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}`.substring(0, 32);
      
      console.log('创建云端存储空间:', binName);
      
      const response = await axios.post(
        `${API_BASE}/b`,
        {
          users: [],
          records: [],
          lastUpdated: new Date().toISOString(),
          userEmail: userEmail // 添加用户邮箱标识
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY,
            'X-Bin-Name': binName,
            'X-Bin-Private': false
          },
          timeout: 15000 // 增加超时时间
        }
      );

      const binId = response.data.metadata.id;
      console.log('✅ 云端存储空间创建成功:', binId);
      return binId;
    } catch (error: any) {
      console.error('❌ 创建云端存储失败:', error.response?.data || error.message);
      throw new Error(`云端存储初始化失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的bin ID
   */
  private getUserBinId(userEmail: string): string | null {
    // 先从缓存查找
    if (this.userBinCache.has(userEmail)) {
      return this.userBinCache.get(userEmail) || null;
    }
    
    // 从localStorage查找
    const binId = localStorage.getItem(`tea-app-bin-${userEmail}`);
    if (binId) {
      this.userBinCache.set(userEmail, binId);
    }
    return binId;
  }

  /**
   * 保存用户的bin ID
   */
  private saveUserBinId(userEmail: string, binId: string): void {
    localStorage.setItem(`tea-app-bin-${userEmail}`, binId);
    this.userBinCache.set(userEmail, binId);
    console.log('💾 用户binId已保存:', { userEmail, binId });
  }

  /**
   * 上传数据到云端
   */
  async uploadData(userEmail: string, users: User[], records: TeaRecord[]): Promise<boolean> {
    try {
      let binId = this.getUserBinId(userEmail);
      
      // 如果没有bin ID，创建新的
      if (!binId) {
        console.log('创建新的云端存储...');
        binId = await this.initUserBin(userEmail);
        this.saveUserBinId(userEmail, binId);
        console.log('云端存储创建成功:', binId);
      }

      const cloudData: CloudData = {
        users,
        records,
        lastUpdated: new Date().toISOString()
      };

      console.log('上传数据到云端...', { userEmail, usersCount: users.length, recordsCount: records.length });

      const response = await axios.put(
        `${API_BASE}/b/${binId}`,
        cloudData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
          },
          timeout: 10000 // 10秒超时
        }
      );

      console.log('✅ 数据已成功同步到云端', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ 云端同步失败:', error.response?.data || error.message);
      
      // 如果是网络错误，保留本地数据
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        console.log('网络问题，数据已保存到本地');
      }
      return false;
    }
  }

  /**
   * 从云端下载数据
   */
  async downloadData(userEmail: string): Promise<CloudData | null> {
    try {
      const binId = this.getUserBinId(userEmail);
      if (!binId) {
        console.log('未找到云端存储ID，尝试查找...');
        return await this.searchUserData(userEmail);
      }

      console.log('从云端下载数据...', { userEmail, binId });

      const response = await axios.get(`${API_BASE}/b/${binId}`, {
        headers: {
          'X-Master-Key': API_KEY
        },
        timeout: 8000 // 8秒超时
      });

      const cloudData = response.data.record;
      console.log('✅ 云端数据下载成功', { 
        usersCount: cloudData.users?.length || 0, 
        recordsCount: cloudData.records?.length || 0 
      });

      return cloudData;
    } catch (error: any) {
      console.error('❌ 云端数据下载失败:', error.response?.data || error.message);
      
      // 如果是404错误，尝试重新查找
      if (error.response?.status === 404) {
        console.log('云端存储不存在，尝试重新查找...');
        return await this.searchUserData(userEmail);
      }
      
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
      console.error('检查云端数据失败:', error);
      return false;
    }
  }

  /**
   * 搜索用户数据（备用方法）
   */
  private async searchUserData(userEmail: string): Promise<CloudData | null> {
    try {
      // 尝试多种可能的bin名称格式
      const possibleNames = [
        `tea-app-${userEmail}`,
        `tea-app-${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        `tea-app-${userEmail.replace('@', '-at-').replace('.', '-dot-')}`,
      ];
      
      console.log('尝试多种格式查找云端数据:', possibleNames);
      
      // 由于JSONBin.io的限制，我们无法直接搜索，但可以尝试常见的命名模式
      // 这里返回null，让系统使用其他方式处理
      return null;
    } catch (error) {
      console.error('搜索用户数据失败:', error);
      return null;
    }
  }

  /**
   * 合并本地和云端数据
   */
  mergeData(localUsers: User[], localRecords: TeaRecord[], cloudData: CloudData): {
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
}

export default new CloudStorageService();
