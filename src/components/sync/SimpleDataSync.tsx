/**
 * 简化版数据同步组件
 * 提供基本的数据导出和导入功能
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Copy, Upload, Download, X } from 'lucide-react';

interface SimpleDataSyncProps {
  onClose: () => void;
}

const SimpleDataSync: React.FC<SimpleDataSyncProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);

  /**
   * 生成导出数据
   */
  const generateExportData = () => {
    try {
      const users = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
      const records = JSON.parse(localStorage.getItem('tea-app-records') || '[]');
      
      const syncData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        users,
        records
      };
      
      setExportData(JSON.stringify(syncData, null, 2));
    } catch (error) {
      console.error('生成导出数据失败:', error);
    }
  };

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = exportData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 导入数据
   */
  const handleImport = () => {
    try {
      const syncData = JSON.parse(importData);
      
      if (!syncData.users || !syncData.records) {
        alert('数据格式不正确');
        return;
      }

      localStorage.setItem('tea-app-users', JSON.stringify(syncData.users));
      localStorage.setItem('tea-app-records', JSON.stringify(syncData.records));
      
      alert('✅ 数据导入成功！请刷新页面查看。');
      onClose();
    } catch {
      alert('数据格式错误，请检查输入的数据');
    }
  };

  // 切换到导出模式时自动生成数据
  React.useEffect(() => {
    if (mode === 'export') {
      generateExportData();
    }
  }, [mode]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-emerald-700">
            跨设备数据同步
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 模式切换 */}
          <div className="flex space-x-2">
            <Button
              variant={mode === 'export' ? 'default' : 'outline'}
              onClick={() => setMode('export')}
              className={mode === 'export' ? 'bg-emerald-600' : ''}
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Button
              variant={mode === 'import' ? 'default' : 'outline'}
              onClick={() => setMode('import')}
              className={mode === 'import' ? 'bg-emerald-600' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </Button>
          </div>

          {mode === 'export' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">📤 导出步骤</h3>
                <p className="text-sm text-green-700">
                  1. 点击"复制数据"按钮<br/>
                  2. 在其他设备打开茶记应用<br/>
                  3. 选择"导入数据"并粘贴<br/>
                  4. 完成同步
                </p>
              </div>

              <Textarea
                value={exportData}
                readOnly
                rows={8}
                className="font-mono text-xs bg-gray-50"
                placeholder="正在生成导出数据..."
              />

              <Button
                onClick={copyToClipboard}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!exportData}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? '✅ 已复制' : '复制数据'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">📥 导入步骤</h3>
                <p className="text-sm text-blue-700">
                  粘贴从其他设备导出的数据到下方文本框中
                </p>
              </div>

              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={8}
                className="font-mono text-xs"
                placeholder="请粘贴从其他设备导出的数据..."
              />

              <Button
                onClick={handleImport}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!importData.trim()}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入数据
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDataSync;