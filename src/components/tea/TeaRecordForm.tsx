/**
 * 茶记录表单组件
 * 用于创建和编辑茶记录信息
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
import ImageUpload from '../ui/image-upload';

interface TeaRecordFormProps {
  record?: TeaRecord;
  onSave: (record: Omit<TeaRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TeaRecordForm: React.FC<TeaRecordFormProps> = ({ record, onSave, onCancel }) => {
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

    onSave(formData);
  };

  const teaTypes = [
    '绿茶', '红茶', '乌龙茶', '白茶', '黄茶', '黑茶', '普洱茶', '花茶', '其他'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-emerald-700">
          {record ? '编辑茶记录' : '记录今日品茶'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teaName">茶叶名称 *</Label>
              <Input
                id="teaName"
                placeholder="例如：西湖龙井"
                value={formData.teaName}
                onChange={(e) => handleChange('teaName', e.target.value)}
                className={errors.teaName ? 'border-red-500' : ''}
              />
              {errors.teaName && <p className="text-red-500 text-sm">{errors.teaName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teaType">茶叶类型 *</Label>
              <Select value={formData.teaType} onValueChange={(value) => handleChange('teaType', value)}>
                <SelectTrigger className={errors.teaType ? 'border-red-500' : ''}>
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
              <Label htmlFor="origin">产地 *</Label>
              <Input
                id="origin"
                placeholder="例如：浙江杭州"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                className={errors.origin ? 'border-red-500' : ''}
              />
              {errors.origin && <p className="text-red-500 text-sm">{errors.origin}</p>}
            </div>
          </div>

          {/* 冲泡信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brewingMethod">冲泡方法 *</Label>
              <Input
                id="brewingMethod"
                placeholder="例如：盖碗冲泡"
                value={formData.brewingMethod}
                onChange={(e) => handleChange('brewingMethod', e.target.value)}
                className={errors.brewingMethod ? 'border-red-500' : ''}
              />
              {errors.brewingMethod && <p className="text-red-500 text-sm">{errors.brewingMethod}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">水温 (°C)</Label>
              <Input
                id="temperature"
                type="number"
                min="60"
                max="100"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseInt(e.target.value) || 85)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brewingTime">冲泡时间 *</Label>
              <Input
                id="brewingTime"
                placeholder="例如：3分钟"
                value={formData.brewingTime}
                onChange={(e) => handleChange('brewingTime', e.target.value)}
                className={errors.brewingTime ? 'border-red-500' : ''}
              />
              {errors.brewingTime && <p className="text-red-500 text-sm">{errors.brewingTime}</p>}
            </div>
          </div>

          {/* 评分 */}
          <div className="space-y-2">
            <Label htmlFor="rating">综合评分</Label>
            <Select value={formData.rating.toString()} onValueChange={(value) => handleChange('rating', parseInt(value))}>
              <SelectTrigger>
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
              <Label htmlFor="appearance">外观描述</Label>
              <Textarea
                id="appearance"
                placeholder="描述茶叶的外观特征..."
                value={formData.appearance}
                onChange={(e) => handleChange('appearance', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aroma">香气描述</Label>
              <Textarea
                id="aroma"
                placeholder="描述茶叶的香气特点..."
                value={formData.aroma}
                onChange={(e) => handleChange('aroma', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taste">口感描述</Label>
              <Textarea
                id="taste"
                placeholder="描述茶汤的口感体验..."
                value={formData.taste}
                onChange={(e) => handleChange('taste', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aftertaste">回甘描述</Label>
              <Textarea
                id="aftertaste"
                placeholder="描述茶汤的回甘感受..."
                value={formData.aftertaste}
                onChange={(e) => handleChange('aftertaste', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* 茶叶图片 */}
          <div className="space-y-2">
            <Label>茶叶图片</Label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(value) => handleChange('imageUrl', value)}
            />
            <p className="text-sm text-gray-500">
              您也可以使用智能占位图片：https://sider.ai/autoimage/tea
            </p>
          </div>

          {/* 品茶心得 */}
          <div className="space-y-2">
            <Label htmlFor="notes">品茶心得</Label>
            <Textarea
              id="notes"
              placeholder="记录您的品茶感受、心得体会..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
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
