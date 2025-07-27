/**
 * 数据导出按钮组件
 * 支持导出HTML和Excel格式
 */

import React from 'react';
import { Button } from '../ui/button';
import { TeaRecord } from '../../types';
import { FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  records: TeaRecord[];
  username: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ records, username }) => {
  /**
   * 导出为HTML（可打印为PDF）
   */
  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} 的茶记录</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #10b981; font-size: 24px; font-weight: bold; }
        .subtitle { color: #666; margin-top: 10px; }
        .record { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
        .record-title { color: #10b981; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .record-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px; }
        .info-item { display: flex; }
        .info-label { font-weight: bold; margin-right: 8px; min-width: 60px; }
        .rating { color: #f59e0b; }
        .description { margin-top: 15px; }
        .description-title { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .description-content { color: #6b7280; line-height: 1.5; }
        @media print {
            body { margin: 0; }
            .record { break-inside: avoid; page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${username} 的茶记录</div>
        <div class="subtitle">导出时间: ${new Date().toLocaleDateString('zh-CN')} | 总记录数: ${records.length} 条</div>
    </div>
    
    ${records.map((record, index) => `
        <div class="record">
            <div class="record-title">${index + 1}. ${record.teaName}</div>
            <div class="record-info">
                <div class="info-item">
                    <span class="info-label">日期:</span>
                    <span>${new Date(record.date).toLocaleDateString('zh-CN')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">茶类:</span>
                    <span>${record.teaType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">产地:</span>
                    <span>${record.origin}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">冲泡:</span>
                    <span>${record.brewingMethod}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">水温:</span>
                    <span>${record.temperature}°C</span>
                </div>
                <div class="info-item">
                    <span class="info-label">时间:</span>
                    <span>${record.brewingTime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">评分:</span>
                    <span class="rating">${'★'.repeat(record.rating)}${'☆'.repeat(5 - record.rating)} (${record.rating}/5)</span>
                </div>
            </div>
            
            ${record.appearance ? `
                <div class="description">
                    <div class="description-title">外观:</div>
                    <div class="description-content">${record.appearance}</div>
                </div>
            ` : ''}
            
            ${record.aroma ? `
                <div class="description">
                    <div class="description-title">香气:</div>
                    <div class="description-content">${record.aroma}</div>
                </div>
            ` : ''}
            
            ${record.taste ? `
                <div class="description">
                    <div class="description-title">口感:</div>
                    <div class="description-content">${record.taste}</div>
                </div>
            ` : ''}
            
            ${record.aftertaste ? `
                <div class="description">
                    <div class="description-title">回甘:</div>
                    <div class="description-content">${record.aftertaste}</div>
                </div>
            ` : ''}
            
            ${record.notes ? `
                <div class="description">
                    <div class="description-title">品茶心得:</div>
                    <div class="description-content">${record.notes}</div>
                </div>
            ` : ''}
            
            ${record.imageUrl ? `
                <div class="description">
                    <div class="description-title">茶叶图片:</div>
                    <div style="margin-top: 10px;">
                        <img src="${record.imageUrl}" alt="${record.teaName}" style="max-width: 300px; max-height: 200px; border-radius: 4px; border: 1px solid #e5e7eb;" />
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <script>
        // 自动打印对话框（可选）
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${username}-tea-records-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 截断文本以适应Excel单元格限制
   */
  const truncateText = (text: string | undefined, maxLength: number = 32000): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...(内容已截断)';
  };

  /**
   * 导出为Excel
   */
  const exportToExcel = () => {
    const worksheetData = records.map(record => ({
      '日期': new Date(record.date).toLocaleDateString('zh-CN'),
      '茶叶名称': truncateText(record.teaName, 100),
      '茶叶类型': truncateText(record.teaType, 50),
      '产地': truncateText(record.origin, 100),
      '冲泡方法': truncateText(record.brewingMethod, 100),
      '水温(°C)': record.temperature,
      '冲泡时间': truncateText(record.brewingTime, 50),
      '评分': record.rating,
      '外观': truncateText(record.appearance, 1000),
      '香气': truncateText(record.aroma, 1000),
      '口感': truncateText(record.taste, 1000),
      '回甘': truncateText(record.aftertaste, 1000),
      '心得': truncateText(record.notes, 5000),
      '图片链接': truncateText(record.imageUrl || '无', 2000),
      '创建时间': new Date(record.createdAt).toLocaleString('zh-CN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 日期
      { wch: 20 }, // 茶叶名称
      { wch: 10 }, // 茶叶类型
      { wch: 15 }, // 产地
      { wch: 15 }, // 冲泡方法
      { wch: 8 },  // 水温
      { wch: 10 }, // 冲泡时间
      { wch: 6 },  // 评分
      { wch: 30 }, // 外观
      { wch: 30 }, // 香气
      { wch: 30 }, // 口感
      { wch: 30 }, // 回甘
      { wch: 50 }, // 心得
      { wch: 40 }, // 图片链接
      { wch: 18 }  // 创建时间
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '茶记录');
    XLSX.writeFile(workbook, `${username}-tea-records-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={exportToHTML}
        className="flex items-center gap-2"
      >
        <FileText className="w-4 h-4" />
        导出HTML
      </Button>
      <Button
        variant="outline"
        onClick={exportToExcel}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        导出Excel
      </Button>
    </div>
  );
};

export default ExportButtons;