/**
 * 茶记录卡片组件
 * 展示单个茶记录的详细信息，支持编辑和删除操作
 */

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TeaRecord } from '../../types';
import { Calendar, MapPin, Thermometer, Clock, Star, Edit, Trash2, Download, Image } from 'lucide-react';
import html2canvas from 'html2canvas';

interface TeaRecordCardProps {
  record: TeaRecord;
  onEdit: (record: TeaRecord) => void;
  onDelete: (id: string) => void;
}

const TeaRecordCard: React.FC<TeaRecordCardProps> = ({ record, onEdit, onDelete }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  /**
   * 格式化日期显示
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * 渲染星级评分
   */
  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  /**
   * 导出茶记录为图片
   */
  const exportAsImage = async (format: 'png' | 'jpg') => {
    if (!exportRef.current) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null, // 使用透明背景，保留原始背景色
        scale: 3, // 增加缩放比例以提高清晰度
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: exportRef.current.scrollHeight
      });

      const link = document.createElement('a');
      link.download = `${record.teaName}-${new Date(record.date).toISOString().split('T')[0]}.${format}`;
      
      if (format === 'png') {
        link.href = canvas.toDataURL('image/png');
      } else {
        link.href = canvas.toDataURL('image/jpeg', 0.9);
      }
      
      link.click();
    } catch (error) {
      console.error('导出图片失败:', error);
    }
  };

  return (
    <div>
      <Card className="w-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold text-emerald-700 mb-1">
                {record.teaName}
              </CardTitle>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(record.date)}
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportAsImage('jpg')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title="导出为图片"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(record)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(record.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-4">
        {/* 茶叶信息 */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            {record.teaType}
          </Badge>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-3 h-3 mr-1" />
            {record.origin}
          </div>
        </div>

        {/* 冲泡信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Thermometer className="w-4 h-4 mr-2 text-red-500" />
            <span>{record.temperature}°C</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            <span>{record.brewingTime}</span>
          </div>
        </div>

        {/* 评分 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">评分:</span>
          <div className="flex">
            {renderRating(record.rating)}
          </div>
          <span className="text-sm text-gray-600">({record.rating}/5)</span>
        </div>

        {/* 品评要点 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">外观:</span>
            <p className="text-gray-600 mt-1">{record.appearance}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">香气:</span>
            <p className="text-gray-600 mt-1">{record.aroma}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">口感:</span>
            <p className="text-gray-600 mt-1">{record.taste}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">回甘:</span>
            <p className="text-gray-600 mt-1">{record.aftertaste}</p>
          </div>
        </div>

        {/* 心得笔记 */}
        {record.notes && (
          <div>
            <span className="font-medium text-gray-700 text-sm">品茶心得:</span>
            <p className="text-gray-600 text-sm mt-1 bg-gray-50 p-3 rounded-md">
              {record.notes}
            </p>
          </div>
        )}

        {/* 茶叶图片 */}
        {record.imageUrl && (
          <div className="mt-4">
            <img
              src={record.imageUrl}
              alt={record.teaName}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
        )}
      </CardContent>
    </Card>

    {/* 隐藏的导出模板 - 与网页显示效果一致 */}
    <div 
      ref={exportRef} 
      className="fixed -left-[9999px] -top-[9999px] w-[800px] bg-gradient-to-br from-emerald-50 to-teal-100 font-sans shadow-lg"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <div className="p-6">
        {/* 头部 */}
        <div className="text-3xl font-bold text-emerald-700 mb-2">{record.teaName}</div>
        <div className="flex items-center text-lg text-gray-600 mb-4">
          <Calendar className="w-5 h-5 mr-2" />
          {formatDate(record.date)}
        </div>
        
        {/* 茶叶信息 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-lg">
            {record.teaType}
          </div>
          <div className="flex items-center text-lg text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            {record.origin}
          </div>
        </div>

        {/* 冲泡信息 */}
        <div className="grid grid-cols-2 gap-4 text-lg mb-6">
          <div className="flex items-center">
            <Thermometer className="w-5 h-5 mr-2 text-red-500" />
            <span>{record.temperature}°C</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            <span>{record.brewingTime}</span>
          </div>
        </div>
        
        {/* 冲泡方法 */}
        <div className="text-lg mb-4">
          <span className="text-gray-600">{record.brewingMethod || '盖碗冲泡'}</span>
        </div>

        {/* 评分 */}
        <div className="flex items-center mb-6">
          <span className="text-lg font-medium mr-2">评分:</span>
          <div className="flex scale-125">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={`w-5 h-5 ${
                  index < record.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-lg text-gray-600 ml-2">({record.rating}/5)</span>
        </div>

        {/* 品评详情 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="font-medium text-lg text-gray-700 mb-2">外观:</div>
            <div className="text-lg text-gray-600">{record.appearance}</div>
          </div>
          <div>
            <div className="font-medium text-lg text-gray-700 mb-2">香气:</div>
            <div className="text-lg text-gray-600">{record.aroma}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="font-medium text-lg text-gray-700 mb-2">口感:</div>
            <div className="text-lg text-gray-600">{record.taste}</div>
          </div>
          <div>
            <div className="font-medium text-lg text-gray-700 mb-2">回甘:</div>
            <div className="text-lg text-gray-600">{record.aftertaste}</div>
          </div>
        </div>

        {/* 品茶心得 */}
        {record.notes && (
          <div className="mb-6">
            <div className="font-medium text-lg text-gray-700 mb-2">品茶心得:</div>
            <div className="text-lg text-gray-600 bg-white/80 p-4 rounded-md">
              {record.notes}
            </div>
          </div>
        )}

        {/* 茶叶图片 */}
        {record.imageUrl && (
          <div className="mb-6">
            <div className="font-medium text-lg text-gray-700 mb-2">茶叶图片</div>
            <div className="flex justify-center">
              <img
                src={record.imageUrl}
                alt={record.teaName}
                className="max-w-full h-64 object-cover rounded-md"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default TeaRecordCard;
