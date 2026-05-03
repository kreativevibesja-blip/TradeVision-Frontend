import type { AnalysisFeatureName, FeatureAccessSummary, SubscriptionTier } from '@/lib/api';

const FEATURE_REQUIREMENTS: Record<AnalysisFeatureName, FeatureAccessSummary['requiredPlan']> = {
  reactionChallenge: 'FREE',
  confidenceThermometer: 'PRO',
  tradeReplay: 'TOP_TIER',
};

const PLAN_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  TOP_TIER: 2,
  VIP_AUTO_TRADER: 2,
};

const REQUIRED_RANK: Record<FeatureAccessSummary['requiredPlan'], number> = {
  FREE: 0,
  PRO: 1,
  TOP_TIER: 2,
};

export const checkFeatureAccess = (subscription: string | null | undefined, feature: AnalysisFeatureName): FeatureAccessSummary => {
  const normalizedPlan: SubscriptionTier = subscription === 'PRO' || subscription === 'TOP_TIER' || subscription === 'VIP_AUTO_TRADER'
    ? subscription
    : 'FREE';
  const requiredPlan = FEATURE_REQUIREMENTS[feature];
  const allowed = PLAN_RANK[normalizedPlan] >= REQUIRED_RANK[requiredPlan];

  return {
    feature,
    allowed,
    requiredPlan,
    currentPlan: normalizedPlan,
    upgradeRequired: allowed || requiredPlan === 'FREE' ? null : requiredPlan,
  };
};