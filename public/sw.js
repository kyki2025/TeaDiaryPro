/**
 * Service Worker for PWA functionality
 * 为PWA功能提供服务工作者支持
 */

const CACHE_NAME = 'tea-records-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 获取事件
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到，返回缓存版本
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});