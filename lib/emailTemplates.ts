// Frontend-side email template metadata (mirrors backend templates)
// The actual HTML is fetched from the API; this is just for UI display.

export const EMAIL_TEMPLATE_KEYS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'upgrade_to_pro', label: 'Upgrade to Pro' },
  { key: 'high_demand', label: 'High Demand Notice' },
  { key: 'feature_update', label: 'Feature Update' },
  { key: 'education', label: 'Education Email' },
] as const;
