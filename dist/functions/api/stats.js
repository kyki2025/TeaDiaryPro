// API端点，返回统计数据
export async function onRequestGet({ env }) {
  try {
    // 从KV存储中获取统计数据
    const visits = await env.TEADIARY_DATA.get('visits', { type: 'json' }) || { count: 0 };
    
    // 增加访问计数
    visits.count += 1;
    await env.TEADIARY_DATA.put('visits', JSON.stringify(visits));
    
    // 返回统计数据
    return new Response(JSON.stringify({
      visits: visits.count,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}