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
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ...(env.__STATIC_CONTENT_MANIFEST && { ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }),
        }
      )
    } catch (e) {
      // 对于SPA路由，返回index.html
      if (e.status === 404) {
        try {
          return await getAssetFromKV(
            {
              request: new Request(`${url.origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ...(env.__STATIC_CONTENT_MANIFEST && { ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }),
            }
          )
        } catch (indexError) {
          return new Response('Not Found', { status: 404 })
        }
      }
      
      return new Response('Server Error', { status: 500 })
    }
  },
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url)
  
  // 健康检查
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  // 茶叶记录API
  if (url.pathname === '/api/tea') {
    if (request.method === 'GET') {
      try {
        const data = await env.TEADIARY_DATA.get('tea_records')
        return new Response(data || '[]', {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: '获取数据失败' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    }
    
    if (request.method === 'POST') {
      try {
        const newRecord = await request.json()
        const existingData = await env.TEADIARY_DATA.get('tea_records')
        const records = existingData ? JSON.parse(existingData) : []
        
        newRecord.id = Date.now().toString()
        newRecord.createdAt = new Date().toISOString()
        records.push(newRecord)
        
        await env.TEADIARY_DATA.put('tea_records', JSON.stringify(records))
        
        return new Response(JSON.stringify({ success: true, record: newRecord }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: '保存数据失败' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    }
  }
  
  // 统计API
  if (url.pathname === '/api/stats') {
    try {
      const data = await env.TEADIARY_DATA.get('tea_records')
      const records = data ? JSON.parse(data) : []
      
      return new Response(JSON.stringify({
        totalRecords: records.length,
        lastUpdated: new Date().toISOString()
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: '获取统计失败' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
  
  return new Response('API Not Found', { status: 404 })
}