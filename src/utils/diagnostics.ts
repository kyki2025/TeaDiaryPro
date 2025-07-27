/**
 * 诊断工具：帮助调试云端同步和登录问题
 */

export class DiagnosticTool {
  /**
   * 检查网络连接状态
   */
  static checkNetworkStatus(): {
    online: boolean;
    connection: string;
  } {
    const online = navigator.onLine;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : 'unknown'
    };
  }

  /**
   * 检查本地存储状态
   */
  static checkLocalStorage(): {
    available: boolean;
    users: number;
    records: number;
    binIds: string[];
  } {
    try {
      const users = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
      const records = JSON.parse(localStorage.getItem('tea-app-records') || '[]');
      
      // 查找所有bin IDs
      const binIds: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tea-app-bin-')) {
          binIds.push(key);
        }
      }

      return {
        available: true,
        users: users.length,
        records: records.length,
        binIds
      };
    } catch (error) {
      return {
        available: false,
        users: 0,
        records: 0,
        binIds: []
      };
    }
  }

  /**
   * 生成诊断报告
   */
  static generateReport(userEmail?: string): string {
    const network = this.checkNetworkStatus();
    const storage = this.checkLocalStorage();

    const report = `
🔍 茶记应用诊断报告
生成时间: ${new Date().toLocaleString()}
用户邮箱: ${userEmail || '未提供'}

📡 网络状态:
- 在线状态: ${network.online ? '✅ 在线' : '❌ 离线'}
- 连接信息: ${JSON.stringify(network.connection, null, 2)}

💾 本地存储:
- 存储可用: ${storage.available ? '✅ 可用' : '❌ 不可用'}
- 用户数量: ${storage.users}
- 记录数量: ${storage.records}
- 云端绑定: ${storage.binIds.length} 个

🔧 建议:
${!network.online ? '- ⚠️ 请检查网络连接' : ''}
${!storage.available ? '- ⚠️ 本地存储不可用，请检查浏览器设置' : ''}
${storage.users === 0 && userEmail ? '- 💡 本地未找到用户数据，需要从云端同步' : ''}
    `;

    console.log(report);
    return report;
  }

  /**
   * 测试云端连接
   */
  static async testCloudConnection(): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // 使用更简单的连接测试
      const response = await fetch('https://api.jsonbin.io/v3', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });

      const latency = Date.now() - startTime;

      return {
        success: response.ok,
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }
}
