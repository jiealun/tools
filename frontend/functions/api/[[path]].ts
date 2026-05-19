// Cloudflare Pages Function - 代理所有 /api/* 请求到 Worker
const WORKER_URL = 'https://toolbox-api.710218980.workers.dev'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const targetUrl = `${WORKER_URL}${url.pathname}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.set('Host', new URL(WORKER_URL).host)

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
