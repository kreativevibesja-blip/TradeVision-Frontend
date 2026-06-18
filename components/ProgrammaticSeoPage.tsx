import { SeoLandingPage } from '@/components/SeoLandingPage';

export function ProgrammaticSeoPage({
  h1,
  description,
  keyword,
  cta,
}: {
  h1: string;
  description: string;
  keyword: string;
  cta: string;
}) {
  return (
    <SeoLandingPage
      eyebrow={keyword}
      title={h1}
      description={description}
      cta={cta}
      sections={[
        {
          title: `${keyword} with chart screenshots`,
          body: 'TradeVision turns uploaded chart screenshots into structured analysis that reviews visible market context, key levels, trend, and risk scenarios.',
          href: '/analysis',
          linkLabel: 'Explore AI chart analysis',
        },
        {
          title: 'Built-in trading mentor',
          body: 'Orion AI helps explain the reasoning behind each analysis so traders can learn concepts instead of only reading signals.',
          href: '/orion',
          linkLabel: 'Meet Orion AI',
        },
        {
          title: 'Trade Radar monitoring',
          body: 'Send strong ideas to Trade Radar to monitor confirmation status, distance to entry, and setup confidence over time.',
          href: '/trade-radar',
          linkLabel: 'Activate Trade Radar',
        },
        {
          title: 'Community and journal workflow',
          body: 'Post analysis to the Feed, discuss ideas with traders, and save lessons in the journal after the setup plays out.',
          href: '/community',
          linkLabel: 'View community',
        },
      ]}
    />
  );
}
