import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // 处理 API 请求
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env)
    }
    
    // 处理静态文件
    try {
      // 检查必要的环境变量
      if (!env.__STATIC_CONTENT) {
        console.error('__STATIC_CONTENT namespace not found')
        return new Response('静态内容命名空间未配置', { 
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
      
      const event = {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      }
      
      const options = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
      }
      
      // 只有在manifest存在时才添加
      if (env.__STATIC_CONTENT_MANIFEST) {
        options.ASSET_MANIFEST = env.__STATIC_CONTENT_MANIFEST
      }
      
      return await getAssetFromKV(event, options)
    } catch (e) {
      console.error('Static asset error:', e.message, e.status)
      
      // 如果是404错误，尝试返回 index.html
      if (e.status === 404) {
        try {
          const indexEvent = {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil: ctx.waitUntil.bind(ctx),
          }
          
          const options = {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
          }
          
          if (env.__STATIC_CONTENT_MANIFEST) {
            options.ASSET_MANIFEST = env.__STATIC_CONTENT_MANIFEST
          }
          
          return await getAssetFromKV(indexEvent, options)
        } catch (indexError) {
          console.error('Index.html error:', indexError.message)
          
          // 如果连index.html都找不到，返回一个简单的HTML页面
          return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>茶记 - 茶叶日记应用</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5rem; margin-bottom: 20px; }
        p { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
        .status { 
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        a { color: #fff; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍃 茶记</h1>
        <p>茶叶日记应用正在启动中...</p>
        <div class="status">
            <p><strong>状态:</strong> Worker运行正常</p>
            <p><strong>API测试:</strong> <a href="/api/health" target="_blank">健康检查</a></p>
            <p><strong>时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`, { 
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        }
      }
      
      return new Response(`服务器错误: ${e.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }
  },
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url)
  
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      version: env.API_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      message: '茶记应用运行正常',
      environment: {
        hasStaticContent: !!env.__STATIC_CONTENT,
        hasManifest: !!env.__STATIC_CONTENT_MANIFEST,
        hasKV: !!env.TEADIARY_DATA
      }
    }), {
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  return new Response('API 未找到', { 
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}