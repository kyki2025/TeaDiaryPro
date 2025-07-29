import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    try {
      // 处理API请求
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, env)
      }
      
      // 处理静态文件
      try {
        const asset = await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
          }
        )
        return asset
      } catch (e) {
        // 如果找不到静态文件，返回index.html（用于SPA路由）
        try {
          const indexRequest = new Request(`${url.origin}/index.html`, request)
          const indexAsset = await getAssetFromKV(
            {
              request: indexRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
            }
          )
          return indexAsset
        } catch (indexError) {
          console.error('Static file error:', indexError)
          return new Response('Not Found', { status: 404 })
        }
      }
    } catch (error) {
      console.error('Worker error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  },
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url)
  
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      version: env.API_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response('API Not Found', { status: 404 })
}