/* A waiting worker only activates for an explicit request from its sole open client.
   Older tabs that do not implement update coordination must be closed as well. */
self.addEventListener('message', event => {
  if (event.data?.type !== 'ROSTERLY_ACTIVATE') return
  event.waitUntil((async () => {
    const clients = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .filter(client => client.url.startsWith(self.registration.scope))
    const allowed = clients.length === 1 && clients[0].id === event.source?.id
    event.ports[0]?.postMessage({ allowed })
    if (allowed) await self.skipWaiting()
  })())
})
