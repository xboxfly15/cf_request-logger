/* eslint-disable no-restricted-globals */
async function handleRequest(event) {
  const request = event.request
  const t1 = Date.now()
  const response = await fetch(request)
  const originTime = Date.now() - t1

  const requestMetadata = {}
  Array.from(request.headers).forEach(([key, value]) => {
    requestMetadata[key.replace(/-/g, '_')] = value
  })

  const responseMetadata = {}
  Array.from(response.headers).forEach(([key, value]) => {
    responseMetadata[key.replace(/-/g, "_")] = value
  })

  const init = {
    method: 'POST',
    headers: {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare Worker via '+requestMetadata.host,
    },
    body: JSON.stringify({
      response: {
        headers: responseMetadata,
        origin_time: originTime,
        status_code: response.status
      },
      request: {
        url: request.url,
        method: request.method,
        headers: requestMetadata
      }
    })
  }

  event.waitUntil(fetch('https://api.galaxymc.dev/data/request/', init))

  return response;
}

addEventListener("fetch", event => {
  event.passThroughOnException()
  event.respondWith(handleRequest(event))
})
