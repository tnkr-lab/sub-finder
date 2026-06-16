self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SubFill', {
      body: data.body,
      icon: '/icons/icon-192.png',
      data: { url: data.url ?? '/feed' },
      requireInteraction: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/feed'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes(url))
      return existing ? existing.focus() : clients.openWindow(url)
    })
  )
})
