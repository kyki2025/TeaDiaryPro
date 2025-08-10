/**
 * 增强版图片上传组件
 * 支持批量上传、图片编辑、裁剪、旋转等功能
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Upload, X, Image as ImageIcon, RotateCcw, Crop, Check, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
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

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditingImage {
  base64: string;
  rotation: number;
  brightness: number;
  contrast: number;
  cropData?: CropData;
  isCropping: boolean;
  cropStart?: { x: number; y: number };
  cropEnd?: { x: number; y: number };
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
  const imageRef = useRef<HTMLImageElement>(null);

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
      contrast: 100,
      isCropping: false,
      cropData: undefined
    });
    setEditingIndex(index);
  };

  /**
   * 处理裁剪模式切换
   */
  const toggleCropMode = () => {
    if (!editingImage) return;
    setEditingImage({
      ...editingImage,
      isCropping: !editingImage.isCropping,
      cropStart: undefined,
      cropEnd: undefined
    });
  };

  /**
   * 处理鼠标按下事件 - 开始裁剪
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editingImage?.isCropping || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setEditingImage({
      ...editingImage,
      cropStart: { x, y },
      cropEnd: { x, y }
    });
  };

  /**
   * 处理鼠标移动事件 - 更新裁剪区域
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editingImage?.isCropping || !editingImage.cropStart || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setEditingImage({
      ...editingImage,
      cropEnd: { x, y }
    });
  };

  /**
   * 处理鼠标释放事件 - 完成裁剪
   */
  const handleMouseUp = () => {
    if (!editingImage?.cropStart || !editingImage?.cropEnd) return;
    
    const { cropStart, cropEnd } = editingImage;
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    
    if (width > 10 && height > 10) {
      setEditingImage({
        ...editingImage,
        cropData: { x, y, width, height }
      });
    }
  };

  /**
   * 应用裁剪
   */
  const applyCrop = async () => {
    if (!editingImage?.cropData || !imageRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const { cropData } = editingImage;
      const scaleX = img.naturalWidth / imageRef.current!.width;
      const scaleY = img.naturalHeight / imageRef.current!.height;
      
      const actualCrop = {
        x: cropData.x * scaleX,
        y: cropData.y * scaleY,
        width: cropData.width * scaleX,
        height: cropData.height * scaleY
      };
      
      canvas.width = actualCrop.width;
      canvas.height = actualCrop.height;
      
      ctx.drawImage(
        img,
        actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
        0, 0, actualCrop.width, actualCrop.height
      );
      
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      setEditingImage({
        ...editingImage,
        base64: croppedBase64,
        cropData: undefined,
        isCropping: false,
        cropStart: undefined,
        cropEnd: undefined
      });
    };
    
    img.src = editingImage.base64;
  };

  /**
   * 保存编辑后的图片
   */
  const handleSaveEdit = () => {
    if (!editingImage || editingIndex === -1) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      let { width, height } = img;
      
      // 应用旋转后的尺寸计算
      if (editingImage.rotation % 180 !== 0) {
        [width, height] = [height, width];
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.save();
      
      // 旋转
      if (editingImage.rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((editingImage.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      // 亮度和对比度
      ctx.filter = `brightness(${editingImage.brightness}%) contrast(${editingImage.contrast}%)`;
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, img.width, img.height);
      
      ctx.restore();
      
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

  /**
   * 获取裁剪区域的样式
   */
  const getCropAreaStyle = () => {
    if (!editingImage?.cropStart || !editingImage?.cropEnd) return {};
    
    const { cropStart, cropEnd } = editingImage;
    const left = Math.min(cropStart.x, cropEnd.x);
    const top = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      pointerEvents: 'none'
    };
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
                <div 
                  className="relative inline-block"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: editingImage.isCropping ? 'crosshair' : 'default' }}
                >
                  <img
                    ref={imageRef}
                    src={editingImage.base64}
                    alt="编辑预览"
                    style={{
                      transform: `rotate(${editingImage.rotation}deg)`,
                      filter: `brightness(${editingImage.brightness}%) contrast(${editingImage.contrast}%)`,
                      maxWidth: '100%',
                      maxHeight: '400px'
                    }}
                  />
                  {editingImage.isCropping && editingImage.cropStart && editingImage.cropEnd && (
                    <div style={getCropAreaStyle()} />
                  )}
                </div>
              </div>

              {/* 编辑控件 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">裁剪</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={editingImage.isCropping ? "default" : "outline"}
                      size="sm"
                      onClick={toggleCropMode}
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      {editingImage.isCropping ? '取消裁剪' : '开始裁剪'}
                    </Button>
                    {editingImage.cropData && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyCrop}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        应用裁剪
                      </Button>
                    )}
                  </div>
                </div>

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