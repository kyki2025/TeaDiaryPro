/**
 * 茶记录表单组件
 * 用于创建和编辑茶记录信息
 * 支持多张图片上传和增强的图片编辑功能
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TeaRecord } from '../../types';
import { Save, X } from 'lucide-react';
import EnhancedImageUpload from '../ui/enhanced-image-upload';

interface TeaRecordFormProps {
  record?: TeaRecord;
  onSave: (record: Omit<TeaRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TeaRecordForm: React.FC<TeaRecordFormProps> = ({ record, onSave, onCancel }) => {
  // 向后兼容：处理旧数据和新数据
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    // 优先使用新的 imageUrls 数组
    if (record?.imageUrls && record.imageUrls.length > 0) {
      return record.imageUrls;
    }
    // 向后兼容：使用旧的 imageUrl 字段
    if (record?.imageUrl) {
      return [record.imageUrl];
    }
    return [];
  });

  const [formData, setFormData] = useState({
    date: record?.date || new Date().toISOString().split('T')[0],
    teaName: record?.teaName || '',
    teaType: record?.teaType || '',
    origin: record?.origin || '',
    brewingMethod: record?.brewingMethod || '',
    temperature: record?.temperature || 85,
    brewingTime: record?.brewingTime || '',
    rating: record?.rating || 5,
    appearance: record?.appearance || '',
    aroma: record?.aroma || '',
    taste: record?.taste || '',
    aftertaste: record?.aftertaste || '',
    notes: record?.notes || '',
    // 保持向后兼容的imageUrl字段
    imageUrl: record?.imageUrl || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 处理表单字段变化
   */
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * 处理图片URL变化
   */
  const handleImageUrlsChange = (urls: string[]) => {
    setImageUrls(urls);
    // 向后兼容：设置第一张图片到imageUrl
    setFormData(prev => ({ ...prev, imageUrl: urls[0] || '' }));
  };

  /**
   * 验证表单数据
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.teaName.trim()) {
      newErrors.teaName = '请输入茶叶名称';
    }
    if (!formData.teaType) {
      newErrors.teaType = '请选择茶叶类型';
    }
    if (!formData.origin.trim()) {
      newErrors.origin = '请输入产地';
    }
    if (!formData.brewingMethod.trim()) {
      newErrors.brewingMethod = '请输入冲泡方法';
    }
    if (!formData.brewingTime.trim()) {
      newErrors.brewingTime = '请输入冲泡时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 构建提交数据
    const submitData = {
      ...formData,
      // 保持向后兼容
      imageUrl: imageUrls[0] || '',
      // 添加对多张图片的支持
      imageUrls: imageUrls
    };

    onSave(submitData);
  };

  const teaTypes = [
    '绿茶', '红茶', '乌龙茶', '白茶', '黄茶', '黑茶', '普洱茶', '花茶', '其他'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-emerald-700">
          {record ? '编辑茶记录' : '记录今日品茶'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-lg">日期</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teaName" className="text-lg">茶叶名称 *</Label>
              <Input
                id="teaName"
                placeholder="例如：西湖龙井"
                value={formData.teaName}
                onChange={(e) => handleChange('teaName', e.target.value)}
                className={`text-base ${errors.teaName ? 'border-red-500' : ''}`}
              />
              {errors.teaName && <p className="text-red-500 text-sm">{errors.teaName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teaType" className="text-lg">茶叶类型 *</Label>
              <Select value={formData.teaType} onValueChange={(value) => handleChange('teaType', value)}>
              <SelectTrigger className={`text-base ${errors.teaType ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="请选择茶叶类型" />
              </SelectTrigger>
                <SelectContent>
                  {teaTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teaType && <p className="text-red-500 text-sm">{errors.teaType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin" className="text-lg">产地 *</Label>
              <Input
                id="origin"
                placeholder="例如：浙江杭州"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                className={`text-base ${errors.origin ? 'border-red-500' : ''}`}
              />
              {errors.origin && <p className="text-red-500 text-sm">{errors.origin}</p>}
            </div>
          </div>

          {/* 冲泡信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brewingMethod" className="text-lg">冲泡方法 *</Label>
              <Input
                id="brewingMethod"
                placeholder="例如：盖碗冲泡"
                value={formData.brewingMethod}
                onChange={(e) => handleChange('brewingMethod', e.target.value)}
                className={`text-base ${errors.brewingMethod ? 'border-red-500' : ''}`}
              />
              {errors.brewingMethod && <p className="text-red-500 text-sm">{errors.brewingMethod}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="text-lg">水温 (°C)</Label>
              <Input
                id="temperature"
                type="number"
                min="60"
                max="100"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseInt(e.target.value) || 85)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brewingTime" className="text-lg">冲泡时间 *</Label>
              <Input
                id="brewingTime"
                placeholder="例如：3分钟"
                value={formData.brewingTime}
                onChange={(e) => handleChange('brewingTime', e.target.value)}
                className={`text-base ${errors.brewingTime ? 'border-red-500' : ''}`}
              />
              {errors.brewingTime && <p className="text-red-500 text-sm">{errors.brewingTime}</p>}
            </div>
          </div>

          {/* 评分 */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-lg">综合评分</Label>
            <Select value={formData.rating.toString()} onValueChange={(value) => handleChange('rating', parseInt(value))}>
              <SelectTrigger className="text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} 星 {rating === 5 ? '(极佳)' : rating === 4 ? '(很好)' : rating === 3 ? '(良好)' : rating === 2 ? '(一般)' : '(需改进)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 品评详情 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appearance" className="text-lg">外观描述</Label>
              <Textarea
                id="appearance"
                placeholder="描述茶叶的外观特征..."
                value={formData.appearance}
                onChange={(e) => handleChange('appearance', e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aroma" className="text-lg">香气描述</Label>
              <Textarea
                id="aroma"
                placeholder="描述茶叶的香气特点..."
                value={formData.aroma}
                onChange={(e) => handleChange('aroma', e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taste" className="text-lg">口感描述</Label>
              <Textarea
                id="taste"
                placeholder="描述茶汤的口感体验..."
                value={formData.taste}
                onChange={(e) => handleChange('taste', e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aftertaste" className="text-lg">回甘描述</Label>
              <Textarea
                id="aftertaste"
                placeholder="描述茶汤的回甘感受..."
                value={formData.aftertaste}
                onChange={(e) => handleChange('aftertaste', e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>
          </div>

          {/* 茶叶图片 - 使用增强版组件 */}
          <div className="space-y-2">
            <Label className="text-lg">茶叶图片</Label>
            <EnhancedImageUpload
              value={imageUrls}
              onChange={handleImageUrlsChange}
              maxImages={5}
              maxSize={10}
            />
            <p className="text-sm text-gray-500">
              支持批量上传，最多5张图片，每张最大10MB。支持拖拽、裁剪、旋转等编辑功能。
            </p>
          </div>

          {/* 品茶心得 */}
          <div className="space-y-2">
              <Label htmlFor="notes" className="text-lg">品茶心得</Label>
              <Textarea
                id="notes"
                placeholder="记录您的品茶感受、心得体会..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="text-base"
              />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {record ? '更新记录' : '保存记录'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeaRecordForm;
