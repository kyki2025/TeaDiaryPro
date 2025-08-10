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
        {(record.imageUrls && record.imageUrls.length > 0) ? (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">茶叶图片</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {record.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${record.teaName}-${index + 1}`}
                  className="max-w-full max-h-48 object-contain rounded-lg border shadow-sm"
                  crossOrigin="anonymous"
                />
              ))}
            </div>
          </div>
        ) : record.imageUrl ? (
          <div className="text-center mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">茶叶图片</h3>
            <div className="flex justify-center">
              <img
                src={record.imageUrl}
                alt={record.teaName}
                className="max-w-full max-h-64 object-contain rounded-lg border shadow-sm"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>

    {/* 隐藏的导出模板 */}
    <div 
      ref={exportRef} 
      className="fixed -left-[9999px] -top-[9999px] w-[800px] bg-white p-8 font-sans"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-emerald-50 p-6 border-b border-emerald-100">
          <h1 className="text-2xl font-bold text-emerald-700 mb-2">{record.teaName}</h1>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            品茶日期: {formatDate(record.date)}
          </div>
        </div>

        {/* 基本信息 */}
        <div className="p-6 bg-white">
          {/* 茶叶信息 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
              {record.teaType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              {record.origin}
            </div>
          </div>

          {/* 冲泡信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 mr-2 text-red-500" />
              <span>{record.temperature}°C</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span>{record.brewingTime}</span>
            </div>
          </div>
          
          {/* 冲泡方法 */}
          <div className="text-sm mb-4">
            <span className="text-gray-600">{record.brewingMethod}</span>
          </div>

          {/* 评分 */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm font-medium">评分:</span>
            <div className="flex">
              {renderRating(record.rating)}
            </div>
            <span className="text-sm text-gray-600">({record.rating}/5)</span>
          </div>

          {/* 品评详情 */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">外观</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded leading-relaxed min-h-[80px]">{record.appearance}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">香气</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded leading-relaxed min-h-[80px]">{record.aroma}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">口感</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded leading-relaxed min-h-[80px]">{record.taste}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">回甘</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded leading-relaxed min-h-[80px]">{record.aftertaste}</p>
            </div>
          </div>

          {/* 品茶心得 */}
          {record.notes && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">品茶心得</h3>
              <p className="text-gray-600 text-sm bg-emerald-50 p-4 rounded border-l-4 border-emerald-200 leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}

          {/* 茶叶图片 */}
          {record.imageUrl && (
            <div className="text-center mb-8">
              <h3 className="font-semibold text-gray-700 mb-4">茶叶图片</h3>
              <div className="flex justify-center">
                <img
                  src={record.imageUrl}
                  alt={record.teaName}
                  className="max-w-full max-h-64 object-contain rounded-lg border shadow-sm"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          )}

          {/* 底部标识 */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              创建时间: {new Date(record.createdAt).toLocaleString('zh-CN')} | 茶记录导出
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TeaRecordCard;
