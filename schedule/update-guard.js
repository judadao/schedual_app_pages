/* Stable PWA update layer. Remote workers still require sole-client activation;
   local update packages atomically replace the cached web build and can be removed. */
const LOCAL_CONTROL_CACHE = 'rosterly-local-update-control-v1'
const LOCAL_CACHE_PREFIX = 'rosterly-local-update-build-'
const LOCAL_MARKER_URL = new URL('__rosterly_local_update__/active.json', self.registration.scope).href

const scopedClients = async () => (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
  .filter(client => client.url.startsWith(self.registration.scope))
const soleClient = async source => {
  const clients = await scopedClients()
  return clients.length === 1 && clients[0].id === source?.id
}
const readMarker = async () => {
  const response = await (await caches.open(LOCAL_CONTROL_CACHE)).match(LOCAL_MARKER_URL)
  if (!response) return undefined
  try { return await response.json() } catch { return undefined }
}
const writeMarker = async marker => (await caches.open(LOCAL_CONTROL_CACHE)).put(LOCAL_MARKER_URL, new Response(JSON.stringify(marker), { headers: { 'Content-Type': 'application/json' } }))
const clearLocalBuilds = async keep => Promise.all((await caches.keys()).filter(name => name.startsWith(LOCAL_CACHE_PREFIX) && name !== keep).map(name => caches.delete(name)))
const extensionTypes = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', woff2: 'font/woff2', wasm: 'application/wasm' }
const validInstallPath = value => typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !value.includes('\\') && !value.split('/').some(part => !part || part === '.' || part === '..')

self.addEventListener('message', event => {
  const type = event.data?.type
  if (!['ROSTERLY_ACTIVATE', 'ROSTERLY_LOCAL_UPDATE_STATUS', 'ROSTERLY_LOCAL_UPDATE_APPLY', 'ROSTERLY_LOCAL_UPDATE_REMOVE'].includes(type)) return
  event.waitUntil((async () => {
    const reply = value => event.ports[0]?.postMessage(value)
    if (type === 'ROSTERLY_LOCAL_UPDATE_STATUS') {
      const marker = await readMarker()
      reply(marker ? { active: true, build: marker.build } : { active: false })
      return
    }
    const allowed = await soleClient(event.source)
    if (!allowed) { reply({ allowed: false, reason: 'other-tabs' }); return }
    if (type === 'ROSTERLY_ACTIVATE') { reply({ allowed: true }); await self.skipWaiting(); return }
    if (type === 'ROSTERLY_LOCAL_UPDATE_REMOVE') {
      await caches.delete(LOCAL_CONTROL_CACHE)
      await clearLocalBuilds()
      reply({ allowed: true })
      return
    }
    const manifest = event.data?.manifest
    const files = event.data?.files
    if (manifest?.schemaVersion !== 1 || manifest?.updaterProtocol !== 1 || manifest?.product !== 'Rosterly' || !manifest.build?.buildId || !Array.isArray(files) || !files.length || files.length > 512) {
      reply({ allowed: false, reason: '更新檔格式不相容。' }); return
    }
    const cacheName = `${LOCAL_CACHE_PREFIX}${String(manifest.build.buildId).replace(/[^a-zA-Z0-9._-]/g, '-')}`
    const cache = await caches.open(cacheName)
    try {
      const seen = new Set()
      for (const file of files) {
        if (!validInstallPath(file.path) || !(file.content instanceof ArrayBuffer) || seen.has(file.path)) throw new Error('更新檔內容無效。')
        seen.add(file.path)
        const extension = file.path.split('.').pop()?.toLowerCase()
        const headers = { 'Content-Type': extensionTypes[extension] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }
        await cache.put(new URL(file.path, self.registration.scope).href, new Response(file.content, { headers }))
      }
      if (!seen.has('index.html') || !seen.has('version.json')) throw new Error('更新檔內容不完整。')
      await writeMarker({ cacheName, build: manifest.build, installedAt: new Date().toISOString() })
      await clearLocalBuilds(cacheName)
      reply({ allowed: true })
    } catch (error) {
      await caches.delete(cacheName)
      reply({ allowed: false, reason: error instanceof Error ? error.message : '無法安裝更新。' })
    }
  })())
})

const withinScope = url => url.origin === self.location.origin && url.href.startsWith(self.registration.scope)
const networkFallback = async request => {
  const exact = await caches.match(request, { ignoreSearch: true })
  if (exact) return exact
  if (request.mode === 'navigate') {
    const shell = await caches.match(new URL('index.html', self.registration.scope).href, { ignoreSearch: true })
    if (shell) return shell
  }
  return fetch(request)
}

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || !withinScope(url) || request.headers.get('X-Rosterly-Update-Source') === 'network') return
  const relative = url.href.slice(self.registration.scope.length).split(/[?#]/, 1)[0]
  if (relative.startsWith('api/') || relative === 'sw.js' || relative === 'update-guard.js') return
  event.stopImmediatePropagation()
  event.respondWith((async () => {
    if (request.mode === 'navigate' && url.searchParams.get('rosterly-safe-mode') === 'website') {
      await caches.delete(LOCAL_CONTROL_CACHE)
      await clearLocalBuilds()
      return networkFallback(request)
    }
    const marker = await readMarker()
    if (!marker?.cacheName) return networkFallback(request)
    const path = request.mode === 'navigate' ? 'index.html' : relative || 'index.html'
    const response = await (await caches.open(marker.cacheName)).match(new URL(path, self.registration.scope).href)
    return response ?? networkFallback(request)
  })())
})
