import type { Metadata } from 'next';
import { TradeQualityExamples } from '@/components/TradeQualityExamples';

export const metadata: Metadata = {
  title: 'Trade Quality Examples | TradeVision AI',
  description: 'Explore a full trading education hub covering beginner concepts, market structure, strategy selection, execution playbooks, and visual good-vs-bad trade examples.',
};

export default function TradeExamplesPage() {
  return <TradeQualityExamples />;
}