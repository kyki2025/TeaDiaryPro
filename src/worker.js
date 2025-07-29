import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

/**
 * TeaDiary Pro Worker
 * 处理静态资产和 API 请求
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    try {
      // 处理静态资产
      if (url.pathname.startsWith('/api/')) {
        // API 路由处理
        return handleApiRequest(request, env)
      } else {
        // 静态文件处理
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: __STATIC_CONTENT_MANIFEST,
            cacheControl: {
              browserTTL: 60 * 60 * 24 * 30, // 30 天
              edgeTTL: 60 * 60 * 24 * 30,
            },
          }
        )
      }
    } catch (e) {
      // 如果找不到资产，返回 index.html（用于 SPA 路由）
      try {
        return await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: __STATIC_CONTENT_MANIFEST,
          }
        )
      } catch (e) {
        return new Response('Not Found', { status: 404 })
      }
    }
  },
}

/**
 * 处理 API 请求
 */
async function handleApiRequest(request, env) {
  const url = new URL(request.url)
  
  // 示例 API 路由
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      version: env.API_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // 茶叶日记相关 API
  if (url.pathname.startsWith('/api/diary/')) {
    return handleDiaryApi(request, env)
  }
  
  return new Response('API Not Found', { status: 404 })
}

/**
 * 处理茶叶日记 API
 */
async function handleDiaryApi(request, env) {
  const url = new URL(request.url)
  const method = request.method
  
  // 获取茶叶日记列表
  if (url.pathname === '/api/diary/list' && method === 'GET') {
    try {
      const diaries = await env.TEADIARY_DATA.get('diaries')
      return new Response(diaries || '[]', {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: '获取日记失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // 保存茶叶日记
  if (url.pathname === '/api/diary/save' && method === 'POST') {
    try {
      const diary = await request.json()
      const diaries = JSON.parse(await env.TEADIARY_DATA.get('diaries') || '[]')
      
      diary.id = Date.now().toString()
      diary.createdAt = new Date().toISOString()
      diaries.push(diary)
      
      await env.TEADIARY_DATA.put('diaries', JSON.stringify(diaries))
      
      return new Response(JSON.stringify({ success: true, diary }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: '保存日记失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  return new Response('Diary API Not Found', { status: 404 })
}