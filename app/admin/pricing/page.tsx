'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Tag, Save, Plus, Trash2 } from 'lucide-react';

type AdminPlan = {
  id: string;
  name: string;
  tier: 'FREE' | 'PRO';
  price: number;
  dailyLimit: number;
  isActive: boolean;
  features: string[];
};

const emptyNewPlan = {
  name: '',
  tier: 'PRO' as 'FREE' | 'PRO',
  price: '0',
  dailyLimit: '0',
};

export default function AdminPricingPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editName, setEditName] = useState('');
  const [editTier, setEditTier] = useState<'FREE' | 'PRO'>('PRO');
  const [newPlan, setNewPlan] = useState(emptyNewPlan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) loadPlans();
  }, [token]);

  const loadPlans = async () => {
    try {
      const data = await api.admin.getPricingPlans(token!);
      setPlans(data.plans);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (id: string) => {
    try {
      setSaving(true);
      await api.admin.updatePricingPlan(
        id,
        {
          name: editName,
          tier: editTier,
          price: parseFloat(editPrice),
          dailyLimit: parseInt(editLimit, 10),
        },
        token!
      );
      setEditing(null);
      await loadPlans();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const addPlan = async () => {
    try {
      setSaving(true);
      await api.admin.createPricingPlan(
        {
          name: newPlan.name,
          tier: newPlan.tier,
          price: parseFloat(newPlan.price),
          dailyLimit: parseInt(newPlan.dailyLimit, 10),
          features: [],
          isActive: true,
        },
        token!
      );
      setNewPlan(emptyNewPlan);
      await loadPlans();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    try {
      setSaving(true);
      await api.admin.deletePricingPlan(id, token!);
      await loadPlans();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Pricing Plans</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add Pricing Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Plan name"
            value={newPlan.name}
            onChange={(e) => setNewPlan((current) => ({ ...current, name: e.target.value }))}
          />
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm"
            value={newPlan.tier}
            onChange={(e) => setNewPlan((current) => ({ ...current, tier: e.target.value as 'FREE' | 'PRO' }))}
          >
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
          </select>
          <Input
            placeholder="Price"
            type="number"
            value={newPlan.price}
            onChange={(e) => setNewPlan((current) => ({ ...current, price: e.target.value }))}
          />
          <div className="flex gap-3">
            <Input
              placeholder="Daily limit"
              type="number"
              value={newPlan.dailyLimit}
              onChange={(e) => setNewPlan((current) => ({ ...current, dailyLimit: e.target.value }))}
            />
            <Button onClick={addPlan} disabled={saving || !newPlan.name.trim()}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pricing plans configured. Seed the database with initial plans.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    {plan.name}
                    <Badge>{plan.tier}</Badge>
                  </CardTitle>
                  {editing === plan.id ? (
                    <Button size="sm" onClick={() => savePlan(plan.id)} disabled={saving}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(plan.id);
                          setEditName(plan.name);
                          setEditTier(plan.tier);
                          setEditPrice(plan.price.toString());
                          setEditLimit(plan.dailyLimit.toString());
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removePlan(plan.id)} disabled={saving}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing === plan.id ? (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Plan Name</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Tier</label>
                      <select
                        className="mt-2 flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm"
                        value={editTier}
                        onChange={(e) => setEditTier(e.target.value as 'FREE' | 'PRO')}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Price (USD)</label>
                      <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Daily Limit</label>
                      <Input value={editLimit} onChange={(e) => setEditLimit(e.target.value)} type="number" />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-xl font-bold">${plan.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Limit</p>
                      <p className="text-xl font-bold">{plan.dailyLimit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={plan.isActive ? 'success' : 'secondary'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
