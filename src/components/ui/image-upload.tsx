/**
 * 图片上传组件
 * 支持拖拽上传、预览、删除等功能
 */

import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 将文件转换为Base64字符串
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 处理拖拽事件
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * 删除图片
   */
  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="上传的图片"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
              <p className="text-gray-600">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                拖拽图片到这里或点击上传
              </p>
              <p className="text-sm text-gray-500 mb-4">
                支持 JPG、PNG、GIF 格式，最大 5MB
              </p>
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                选择图片
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;