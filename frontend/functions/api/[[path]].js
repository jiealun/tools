// Cloudflare Pages Function - 代理所有 /api/* 请求到 Worker
const WORKER_URL = 'https://toolbox-api.710218980.workers.dev'

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const targetUrl = WORKER_URL + url.pathname + url.search

  const init = {
    method: context.request.method,
    headers: new Headers(context.request.headers),
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body
    init.duplex = 'half'
  }

  try {
    const response = await fetch(targetUrl, init)

    // 复制响应头，去掉一些不能转发的
    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete('content-encoding')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error: ' + err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
