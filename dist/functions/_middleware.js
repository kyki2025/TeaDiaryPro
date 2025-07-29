// 中间件函数，处理所有请求
export async function onRequest(context) {
  // 添加通用响应头
  const response = await context.next();
  response.headers.set('X-Powered-By', 'TeaDiaryPro');
  response.headers.set('X-Version', context.env.API_VERSION || '1.0.0');
  
  return response;
}