'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isPushSupported,
  getPushPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  registerServiceWorker,
} from '@/lib/pushNotifications';

interface Props {
  token: string;
}

export default function PushNotificationPrompt({ token }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const sup = isPushSupported();
      setSupported(sup);
      if (!sup) return;

      setPermission(getPushPermissionState());

      // Register SW on mount (idempotent)
      await registerServiceWorker();

      // Check if already subscribed
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      }
    };
    check();
  }, []);

  if (!supported) return null;
  if (permission === 'denied') return null;
  if (subscribed) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const sub = await subscribeToPush(token);
      if (sub) {
        setSubscribed(true);
        setPermission('granted');
      }
    } catch (err) {
      console.error('[Push] Enable failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <BellRing className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Enable push notifications</p>
        <p className="text-xs text-muted-foreground">
          Get real-time alerts when the scanner finds high-probability setups — even when this tab is closed.
        </p>
      </div>
      <Button
        variant="gradient"
        size="sm"
        onClick={handleEnable}
        disabled={loading}
        className="flex-shrink-0 gap-1.5"
      >
        <Bell className="h-3.5 w-3.5" />
        {loading ? 'Enabling…' : 'Enable'}
      </Button>
    </div>
  );
}
