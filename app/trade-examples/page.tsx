import type { Metadata } from 'next';
import { TradeQualityExamples } from '@/components/TradeQualityExamples';

export const metadata: Metadata = {
  title: 'Trade Quality Examples | TradeVision AI',
  description: 'Learn what separates high-probability trades from low-quality entries with visual trade examples and side-by-side breakdowns.',
};

export default function TradeExamplesPage() {
  return <TradeQualityExamples />;
}