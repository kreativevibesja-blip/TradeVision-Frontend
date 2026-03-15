'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Tag, Save } from 'lucide-react';

export default function AdminPricingPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLimit, setEditLimit] = useState('');

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
      await api.admin.updatePricingPlan(
        id,
        { price: parseFloat(editPrice), dailyLimit: parseInt(editLimit) },
        token!
      );
      setEditing(null);
      loadPlans();
    } catch {
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Pricing Plans</h1>

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
                    <Button size="sm" onClick={() => savePlan(plan.id)}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(plan.id);
                        setEditPrice(plan.price.toString());
                        setEditLimit(plan.dailyLimit.toString());
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing === plan.id ? (
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-3 gap-4">
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
