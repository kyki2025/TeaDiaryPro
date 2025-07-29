// 茶叶数据API
export async function onRequestGet({ env, params }) {
  try {
    const teaData = await env.TEADIARY_DATA.get('tea_collection', { type: 'json' }) || [];
    return new Response(JSON.stringify(teaData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const teaData = await env.TEADIARY_DATA.get('tea_collection', { type: 'json' }) || [];
    const newTea = await request.json();
    
    // 添加ID和时间戳
    newTea.id = Date.now().toString();
    newTea.createdAt = new Date().toISOString();
    
    teaData.push(newTea);
    await env.TEADIARY_DATA.put('tea_collection', JSON.stringify(teaData));
    
    return new Response(JSON.stringify(newTea), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}