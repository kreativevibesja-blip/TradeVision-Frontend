/* ── Frontend Push Notification helpers ── */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const DEFAULT_API_URL = 'http://localhost:4000/api';

function normalizeApiUrl(value?: string): string {
  const rawValue = value?.trim();
  if (!rawValue) {
    return DEFAULT_API_URL;
  }

  try {
    const parsedUrl = new URL(rawValue);
    const normalizedPath = parsedUrl.pathname === '/' ? '/api' : parsedUrl.pathname.replace(/\/$/, '');
    parsedUrl.pathname = normalizedPath.endsWith('/api') ? normalizedPath : `${normalizedPath}/api`;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    const trimmed = rawValue.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Push] Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push] Service worker registered');
    return registration;
  } catch (err) {
    console.error('[Push] SW registration failed:', err);
    return null;
  }
}

async function postSubscription(token: string, subscription: PushSubscription): Promise<void> {
  const keys = subscription.toJSON().keys;
  const response = await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: keys?.p256dh ?? '',
      auth: keys?.auth ?? '',
    }),
  });

  if (!response.ok) {
    let message = 'Failed to save push subscription';
    try {
      const body = await response.json();
      if (body?.error) {
        message = String(body.error);
      }
    } catch {
      // ignore JSON parse errors for non-JSON responses
    }
    throw new Error(message);
  }
}

export async function syncExistingPushSubscription(token: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return false;
  }

  const ready = await navigator.serviceWorker.ready;
  const subscription = await ready.pushManager.getSubscription();
  if (!subscription) {
    return false;
  }

  await postSubscription(token, subscription);
  return true;
}

export async function subscribeToPush(token: string): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    return null;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const registration = await registerServiceWorker();
  if (!registration) return null;

  // Wait for the service worker to be ready
  const ready = await navigator.serviceWorker.ready;

  // Check for existing subscription first
  let subscription = await ready.pushManager.getSubscription();

  if (!subscription) {
    subscription = await ready.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  await postSubscription(token, subscription);

  console.log('[Push] Subscribed successfully');
  return subscription;
}

export async function unsubscribeFromPush(token: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    const response = await fetch(`${API_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove push subscription');
    }
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
