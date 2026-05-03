'use client';

import { useMemo } from 'react';
import type { AnalysisFeatureName } from '@/lib/api';
import { checkFeatureAccess } from '@/lib/analysisFeatureAccess';

export const useAnalysisFeatureAccess = (subscription: string | null | undefined) => {
  const accessMap = useMemo(() => ({
    reactionChallenge: checkFeatureAccess(subscription, 'reactionChallenge'),
    confidenceThermometer: checkFeatureAccess(subscription, 'confidenceThermometer'),
    tradeReplay: checkFeatureAccess(subscription, 'tradeReplay'),
  }), [subscription]);

  const canUseFeature = (feature: AnalysisFeatureName) => accessMap[feature];

  return {
    accessMap,
    canUseFeature,
  };
};