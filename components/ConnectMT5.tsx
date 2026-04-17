'use client';

import { FormEvent, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Server, Shield } from 'lucide-react';
import { api, type MT5ConnectResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConnectMT5Props = {
  token: string;
  onConnected: (response: MT5ConnectResponse) => void | Promise<void>;
  onCancel?: () => void;
};

export default function ConnectMT5({ token, onConnected, onCancel }: ConnectMT5Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus('connecting');
    setError(null);

    try {
      const response = await api.mt5.connect({ login, password, server }, token);
      setStatus(response.status === 'failed' ? 'failed' : response.status === 'connected' ? 'connected' : 'connecting');
      setPassword('');
      await onConnected(response);
    } catch (connectError: any) {
      setStatus('failed');
      setError(connectError?.message || 'Failed to connect MT5 account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-bold">Connect MT5 Account</h3>
        <p className="text-sm text-muted-foreground">
          Enter your MT5 login, password, and broker server. Your password is used only to provision the MetaAPI connection and is not stored in plaintext.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Account Login</label>
          <Input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="12345678" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Server</label>
          <Input value={server} onChange={(event) => setServer(event.target.value)} placeholder="Broker-Server" required />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
        <Shield className="mr-1 inline h-3.5 w-3.5 text-emerald-400" />
        Plain passwords are not persisted by this flow. Use a dedicated broker investor or trading password only if your operational policy allows it.
      </div>

      {status === 'connecting' && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-100">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Connecting...
        </div>
      )}

      {status === 'connected' && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Connected ✅
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Failed ❌{error ? ` ${error}` : ''}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Server className="mr-1.5 h-4 w-4" />}
          Connect MT5
        </Button>
      </div>
    </form>
  );
}
