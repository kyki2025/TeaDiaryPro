/**
 * 增强版图片上传组件
 * 支持批量上传、图片编辑、裁剪、旋转等功能
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Upload, X, Image as ImageIcon, RotateCcw, Crop, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Slider } from './slider';

interface EnhancedImageUploadProps {
  value?: string[];
  onChange: (value: string[]) => void;
  className?: string;
  maxImages?: number;
  maxSize?: number; // MB
}

interface EditingImage {
  base64: string;
  rotation: number;
  brightness: number;
  contrast: number;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({ 
  value = [], 
  onChange, 
  className,
  maxImages = 10,
  maxSize = 10 // 默认10MB
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
   * 压缩图片
   */
  const compressImage = async (base64: string, maxWidth: number = 1920, maxHeight: number = 1080): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        let { width, height } = img;
        
        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为base64，质量0.8
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64;
    });
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (value.length + fileArray.length > maxImages) {
      alert(`最多只能上传${maxImages}张图片`);
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} 不是有效的图片文件`);
          continue;
        }

        if (file.size > maxSize * 1024 * 1024) {
          alert(`${file.name} 大小不能超过${maxSize}MB`);
          continue;
        }

        const base64 = await fileToBase64(file);
        const compressedBase64 = await compressImage(base64);
        newImages.push(compressedBase64);
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
      }
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
      handleFileUpload(files);
    }
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = '';
  };

  /**
   * 删除图片
   */
  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  /**
   * 编辑图片
   */
  const handleEdit = (index: number) => {
    setEditingImage({
      base64: value[index],
      rotation: 0,
      brightness: 100,
      contrast: 100
    });
    setEditingIndex(index);
  };

  /**
   * 保存编辑后的图片
   */
  const handleSaveEdit = () => {
    if (!editingImage || editingIndex === -1) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // 应用编辑效果
      ctx.save();
      
      // 旋转
      if (editingImage.rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((editingImage.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // 亮度和对比度
      ctx.filter = `brightness(${editingImage.brightness}%) contrast(${editingImage.contrast}%)`;
      ctx.drawImage(img, 0, 0);

      ctx.restore();

      // 保存编辑后的图片
      const editedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      const newImages = [...value];
      newImages[editingIndex] = editedBase64;
      onChange(newImages);

      setEditingImage(null);
      setEditingIndex(-1);
    };

    img.src = editingImage.base64;
  };

  /**
   * 旋转图片
   */
  const rotateImage = (direction: 'left' | 'right') => {
    if (!editingImage) return;
    const newRotation = editingImage.rotation + (direction === 'left' ? -90 : 90);
    setEditingImage({ ...editingImage, rotation: newRotation });
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 上传区域 */}
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
            <p className="text-sm text-gray-500 mb-2">
              支持 JPG、PNG、GIF 格式，最大 {maxSize}MB
            </p>
            <p className="text-xs text-gray-400">
              已上传 {value.length}/{maxImages} 张
            </p>
            <Button type="button" variant="outline" className="mt-2">
              <Upload className="w-4 h-4 mr-2" />
              选择图片
            </Button>
          </div>
        )}
      </div>

      {/* 图片预览网格 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {value.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`图片 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(index)}
                  >
                    <Crop className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 图片编辑对话框 */}
      {editingImage && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>编辑图片</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 预览区域 */}
              <div className="flex justify-center">
                <img
                  src={editingImage.base64}
                  alt="编辑预览"
                  style={{
                    transform: `rotate(${editingImage.rotation}deg)`,
                    filter: `brightness(${editingImage.brightness}%) contrast(${editingImage.contrast}%)`,
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                />
              </div>

              {/* 编辑控件 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">旋转</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => rotateImage('left')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      左转
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => rotateImage('right')}
                    >
                      <ChevronRight className="w-4 h-4" />
                      右转
                    </Button>
                    <span className="text-sm text-gray-500 flex items-center">
                      {editingImage.rotation}°
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">亮度</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[editingImage.brightness]}
                      min={0}
                      max={200}
                      step={1}
                      onValueChange={([value]) => 
                        setEditingImage({ ...editingImage, brightness: value })
                      }
                    />
                    <span className="text-sm text-gray-500 w-12">
                      {editingImage.brightness}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">对比度</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[editingImage.contrast]}
                      min={0}
                      max={200}
                      step={1}
                      onValueChange={([value]) => 
                        setEditingImage({ ...editingImage, contrast: value })
                      }
                    />
                    <span className="text-sm text-gray-500 w-12">
                      {editingImage.contrast}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingImage(null)}
                >
                  取消
                </Button>
                <Button type="button" onClick={handleSaveEdit}>
                  <Check className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedImageUpload;