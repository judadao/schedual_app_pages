self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const scope = self.registration.scope
    const scopePath = new URL(scope).pathname
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter(name => name.includes(scope) || name.includes(scopePath))
      .map(name => caches.delete(name)))
    await self.clients.claim()
    await self.registration.unregister()
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(clients
      .filter(client => client.url.startsWith(scope))
      .map(client => client.navigate(client.url)))
  })())
})
