export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    try {
      // 处理API请求
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, env)
      }
      
      // 处理静态文件
      let pathname = url.pathname
      if (pathname === '/') {
        pathname = '/index.html'
      }
      
      // 移除开头的斜杠
      const assetKey = pathname.startsWith('/') ? pathname.slice(1) : pathname
      
      try {
        // 首先尝试直接匹配
        const asset = await env.__STATIC_CONTENT.get(assetKey, { type: 'arrayBuffer' })
        
        if (asset) {
          const contentType = getContentType(assetKey)
          return new Response(asset, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
            },
          })
        }
        
        // 如果直接匹配失败，尝试查找带哈希的文件名
        const keys = await env.__STATIC_CONTENT.list()
        const matchingKey = keys.keys.find(key => {
          // 匹配模式：filename.hash.extension
          const baseName = assetKey.split('.')[0]
          const extension = assetKey.split('.').pop()
          return key.name.startsWith(baseName + '.') && key.name.endsWith('.' + extension)
        })
        
        if (matchingKey) {
          const hashedAsset = await env.__STATIC_CONTENT.get(matchingKey.name, { type: 'arrayBuffer' })
          if (hashedAsset) {
            const contentType = getContentType(assetKey)
            return new Response(hashedAsset, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
              },
            })
          }
        }
        
      } catch (kvError) {
        console.error('KV error:', kvError)
      }
      
      // 如果找不到文件，对于SPA路由返回index.html
      if (!pathname.includes('.')) {
        try {
          // 查找index.html文件（可能有哈希）
          const keys = await env.__STATIC_CONTENT.list()
          const indexKey = keys.keys.find(key => 
            key.name.startsWith('index.') && key.name.endsWith('.html')
          )
          
          if (indexKey) {
            const indexAsset = await env.__STATIC_CONTENT.get(indexKey.name, { type: 'arrayBuffer' })
            if (indexAsset) {
              return new Response(indexAsset, {
                headers: {
                  'Content-Type': 'text/html',
                  'Cache-Control': 'public, max-age=86400',
                },
              })
            }
          }
        } catch (indexError) {
          console.error('Index error:', indexError)
        }
      }
      
      return new Response('Not Found', { status: 404 })
      
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 })
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
      kvNamespace: env.__STATIC_CONTENT ? 'available' : 'not available'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  return new Response('API Not Found', { status: 404 })
}

function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  }
  return types[ext] || 'application/octet-stream'
}