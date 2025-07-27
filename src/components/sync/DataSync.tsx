/**
 * 跨设备数据同步组件
 * 支持二维码扫描和链接分享方式同步数据
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { QrCode, Download, Upload, Link, Copy, Check } from 'lucide-react';
import { User, TeaRecord } from '../../types';

interface DataSyncProps {
  onDataImported: (users: User[], records: TeaRecord[]) => void;
  onClose: () => void;
}

const DataSync: React.FC<DataSyncProps> = ({ onDataImported, onClose }) => {
  const [mode, setMode] = useState<'import' | 'export'>('import');
  const [importData, setImportData] = useState('');
  const [exportData, setExportData] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState('');

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
      
      const dataString = JSON.stringify(syncData, null, 2);
      setExportData(dataString);
      
      // 生成分享链接
      const encodedData = btoa(JSON.stringify(syncData));
      const shareUrl = `${window.location.origin}${window.location.pathname}#sync=${encodedData}`;
      setQrCode(shareUrl);
      
    } catch (error) {
      console.error('生成导出数据失败:', error);
    }
  };

  /**
   * 导入数据
   */
  const handleImportData = () => {
    try {
      if (!importData.trim()) {
        alert('请输入要导入的数据');
        return;
      }

      let syncData;
      try {
        // 尝试解析JSON
        syncData = JSON.parse(importData);
      } catch {
        // 尝试解析base64编码的数据
        try {
          const decoded = atob(importData);
          syncData = JSON.parse(decoded);
        } catch {
          alert('数据格式不正确，请检查输入的数据');
          return;
        }
      }

      if (!syncData.users || !syncData.records) {
        alert('数据格式不完整，缺少必要字段');
        return;
      }

      // 导入数据
      onDataImported(syncData.users, syncData.records);
      alert('✅ 数据导入成功！');
      onClose();
      
    } catch (error) {
      console.error('导入数据失败:', error);
      alert('导入失败，请检查数据格式');
    }
  };

  /**
   * 复制数据到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 检查URL中的同步数据
   */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#sync=')) {
      const encodedData = hash.substring(6);
      try {
        const syncData = JSON.parse(atob(encodedData));
        if (syncData.users && syncData.records) {
          setImportData(JSON.stringify(syncData, null, 2));
          setMode('import');
        }
      } catch (error) {
        console.error('解析URL同步数据失败:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (mode === 'export') {
      generateExportData();
    }
  }, [mode]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-emerald-700">
            跨设备数据同步
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={mode === 'import' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('import')}
              className={mode === 'import' ? 'bg-emerald-600' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </Button>
            <Button
              variant={mode === 'export' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('export')}
              className={mode === 'export' ? 'bg-emerald-600' : ''}
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {mode === 'import' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">📱 从网页端获取数据</h3>
                <p className="text-sm text-blue-700">
                  1. 在网页端打开茶记应用<br/>
                  2. 点击同步按钮，选择"导出数据"<br/>
                  3. 复制导出的数据或分享链接<br/>
                  4. 在此处粘贴数据完成同步
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  粘贴同步数据：
                </label>
                <Textarea
                  placeholder="请粘贴从网页端导出的数据..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleImportData}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!importData.trim()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </Button>
                <Button variant="outline" onClick={onClose}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">📤 导出到其他设备</h3>
                <p className="text-sm text-green-700">
                  复制下方数据到其他设备，或者使用分享链接快速同步
                </p>
              </div>

              {qrCode && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">分享链接（可直接点击访问）：</p>
                  <div className="bg-gray-50 p-3 rounded border text-xs break-all">
                    <a href={qrCode} className="text-blue-600 hover:text-blue-700">
                      {qrCode}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(qrCode)}
                    className="flex items-center"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? '已复制' : '复制链接'}
                  </Button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  导出数据：
                </label>
                <Textarea
                  value={exportData}
                  readOnly
                  rows={8}
                  className="font-mono text-xs bg-gray-50"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => copyToClipboard(exportData)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? '已复制数据' : '复制数据'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSync;