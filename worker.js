/* eslint-disable no-restricted-globals */
const sourceKey = 'cloudflare_loglocation_worker'
const apiKey = 'rwtryetgrhdfgwacd56rwfe3r1dfg'

function postLogs(init, hostname) {
  const url = extractRootDomain(hostname)
  const post = init
  post.body = JSON.stringify(init.body)
  console.log(url)
  return fetch('https://cloudflare.'+url+'/log', post)
}

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
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare Worker via '+requestMetadata.host,
    },
    body: {
      source: sourceKey,
      metadata: {
        response: {
          headers: responseMetadata,
          origin_time: originTime,
          status_code: response.status,
        },
        request: {
          url: request.url,
          method: request.method,
          headers: requestMetadata,
          cf: request.cf,
        },
      },
    },
  }

  event.waitUntil(postLogs(init, requestMetadata.host))
  return response
}

addEventListener("fetch", event => {
  event.passThroughOnException()
  event.respondWith(handleRequest(event))
})

function extractRootDomain(host) {
  var domain = host.split('.')

  if (domain == undefined || domain.length < 2)
    domain = 'galaxymc.co.uk'
  else if (domain[domain.length-2] == 'co'  && domain[domain.length-1] == 'uk')
    domain = domain[domain.length-3]+'.'+domain[domain.length-2]+'.'+domain[domain.length-1]
  else
    domain = domain[domain.length-2]+'.'+domain[domain.length-1]
  return domain;
}
