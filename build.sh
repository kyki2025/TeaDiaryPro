#!/bin/bash

# Cloudflare Pages 构建脚本
echo "开始构建 TeaDiary Pro..."

# 安装依赖
npm install

# 运行构建
npm run build

echo "构建完成！"
echo "这是一个 Cloudflare Pages 项目，不需要 wrangler deploy"
echo "静态文件已准备好部署"