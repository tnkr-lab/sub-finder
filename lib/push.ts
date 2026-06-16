import webpush from 'web-push'
import type { PushSubscription } from 'web-push'

let initialized = false

function initVapid() {
  if (initialized) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  initialized = true
}

export async function sendPush(subscription: PushSubscription, payload: object) {
  initVapid()
  return webpush.sendNotification(subscription, JSON.stringify(payload))
}
