const logflareApiKey = 'rwtryetgrhdfgwacd56rwfe3r1dfg'
const logflareSource = 'cloudflare_loglocation_worker'

const options = {
  source: logflareSource,
  logflare: {
    api_key: logflareApiKey,
  }
}

// window is not available in workers so we disable no-restricted-globals
/* eslint-disable no-restricted-globals */

const sourceKey = options.source
const apiKey = options.logflare.api_key

function buildHeaders(request, response) {
  const headers = {
    method: request.method,
    url: request.url,
    user_agent: request.headers.get("user-agent"),
    cf_ray: request.headers.get("cf-ray"),
    cf_connecting_ip: request.headers.get("cf-connecting-ip"),
    cf_ip_country: request.headers.get("cf-ip-country") || request.headers.get("cf-ipcountry"),
    statusCode: response.status,
    content_length: response.headers.get("content-length"),
    cf_cache_status: response.headers.get("cf-cache-status"),
    content_type: response.headers.get("content-type"),
    response_connection: response.headers.get("connection"),
    request_connection: request.headers.get("connection"),
    cache_control: response.headers.get("cache-control"),
    accept_ranges: response.headers.get("accept-ranges"),
    expect_ct: response.headers.get("expect-ct"),
    expires: response.headers.get("expires"),
    last_modified: response.headers.get("last-modified"),
    vary: response.headers.get("vary"),
    server: response.headers.get("server"),
    etag: response.headers.get("etag"),
    date: response.headers.get("date"),
    transfer_encoding: response.headers.get("transfer-encoding"),
    location: response.headers.get("location")
  }

  return headers;
}

async function postLogs(domain, init, connectingIp) {
  const post = init
  post.body = JSON.stringify(init.body)
  const url = 'https://cloudflare.'+domain+'/log';
  console.log(url)
  return fetch(url, post)
}

async function handleRequest(event) {
  const request = event.request

  const requestHeaders = Array.from(request.headers)

  const t1 = Date.now()

  let response = await fetch(request)

  const originTimeMs = Date.now() - t1

  const rHost = request.headers.get("host")
  const rUrl = request.url
  const rMeth = request.method
  const rCf = request.cf
  const requestMetadata = {}

  requestHeaders.forEach(([key, value]) => {
    requestMetadata[key.replace(/-/g, "_")] = value
  })

  const responseHeaders = Array.from(response.headers)

  const responseMetadata = {}

  responseHeaders.forEach(([key, value]) => {
    responseMetadata[key.replace(/-/g, "_")] = value
  })

  const statusCode = response.status

  const allHeaders = buildHeaders(request, response)

  const init = {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
      "User-Agent": `Cloudflare Worker via ${rHost}`,
    },
    body: {
      source: sourceKey,
      metadata: {
        headers: allHeaders,
        response: {
          headers: responseMetadata,
          origin_time: originTimeMs,
          status_code: statusCode,
        },
        request: {
          url: rUrl,
          method: rMeth,
          headers: requestMetadata,
          cf: rCf,
        },
      },
    },
  }
  const connectingIp = requestMetadata.cf_connecting_ip
  //var resp = await postLogs(extractRootDomain(rUrl),init, connectingIp)
  postLogs(extractRootDomain(rUrl),init, connectingIp)
  //event.waitUntil(resp)
  //let newResponse = new Response(response.body, response)
  
  //newResponse.headers.set("X-log", resp.text())
  //newResponse.headers.set("X-log", 'https://cloudflare.'+extractRootDomain(rUrl)+'/log')
  //return newResponse
  return response
}

addEventListener("fetch", event => {
  event.passThroughOnException()
  event.respondWith(handleRequest(event))
})

function extractRootDomain(url) {
    var hostname = new URL(url).hostname
    var domain = hostname.split('.')

    if (domain == undefined || domain.length < 2)
      domain = 'galaxymc.co.uk'
    else if (domain[domain.length-2] == 'co'  && domain[domain.length-1] == 'uk')
      domain = domain[domain.length-3]+'.'+domain[domain.length-2]+'.'+domain[domain.length-1]
    else
      domain = domain[domain.length-2]+'.'+domain[domain.length-1]
    return domain;
}