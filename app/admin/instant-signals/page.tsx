'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, type InstantSignal, type InstantSignalStatus } from '@/lib/api';

const resultOptions = ['all', 'win', 'loss', 'expired', 'cancelled'];
const statusOptions: InstantSignalStatus[] = ['active', 'tp_hit', 'sl_hit', 'expired', 'cancelled'];

export default function AdminInstantSignalsPage() {
  const { token } = useAuth();
  const [signals, setSignals] = useState<InstantSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ user: '', market: '', result: 'all', from: '', to: '' });
  const [error, setError] = useState('');

  const loadSignals = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.admin.getInstantSignals(token, filters);
      setSignals(response.signals);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load instant signals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSignals();
  }, [token]);

  const updateSignal = async (id: string, status: InstantSignalStatus) => {
    if (!token) return;
    const result = status === 'tp_hit' ? 'win' : status === 'sl_hit' ? 'loss' : status === 'expired' ? 'expired' : status === 'cancelled' ? 'cancelled' : undefined;
    await api.admin.updateInstantSignal(id, { status, result }, token);
    await loadSignals();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Admin</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Instant Signals</h1>
        </div>
        <Button onClick={() => void loadSignals()} disabled={loading} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <Input placeholder="User id" value={filters.user} onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))} />
          <Input placeholder="Market" value={filters.market} onChange={(event) => setFilters((current) => ({ ...current, market: event.target.value }))} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.result} onChange={(event) => setFilters((current) => ({ ...current, result: event.target.value }))}>
            {resultOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
          <Button variant="outline" onClick={() => void loadSignals()} className="md:col-span-5">Apply filters</Button>
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <Card className="border-slate-200 bg-white">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="p-3">Market</th>
                <th className="p-3">User</th>
                <th className="p-3">Status</th>
                <th className="p-3">Result</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Created</th>
                <th className="p-3">Payload</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.id} className="border-b border-slate-100 align-top">
                  <td className="p-3 font-bold text-slate-950">{signal.market}<div className="text-xs font-medium text-slate-500">{signal.assetClass} · {signal.timeframe}</div></td>
                  <td className="p-3 text-slate-600">{signal.user?.email ?? signal.userId}</td>
                  <td className="p-3"><Badge variant="outline">{signal.status}</Badge></td>
                  <td className="p-3">{signal.result ?? '-'}</td>
                  <td className="p-3">{signal.confidence}%</td>
                  <td className="p-3">{new Date(signal.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <details>
                      <summary className="cursor-pointer text-blue-600">Inspect</summary>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(signal, null, 2)}</pre>
                    </details>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <Button key={status} size="sm" variant="outline" onClick={() => void updateSignal(signal.id, status)} className="h-8 text-xs">
                          {status}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!signals.length && !loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    No instant signals found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
