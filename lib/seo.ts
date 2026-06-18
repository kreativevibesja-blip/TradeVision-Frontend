import type { Metadata } from 'next';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mytradevision.online').replace(/\/$/, '');

export const seoKeywords = [
  'AI trading analysis',
  'AI chart analysis',
  'AI forex analysis',
  'AI gold analysis',
  'synthetic indices analysis',
  'chart screenshot analysis',
  'upload chart for trading analysis',
  'trading AI assistant',
  'trade radar',
  'trading mentor AI',
];

export const publicSeoRoutes = [
  '/',
  '/pricing',
  '/features',
  '/community',
  '/orion',
  '/trade-radar',
  '/analysis',
  '/journal',
  '/blog',
  '/help',
  '/contact',
  '/faq',
  '/forex-analysis',
  '/gold-analysis',
  '/crypto-analysis',
  '/synthetic-indices-analysis',
  '/market-structure',
  '/trading-mentor',
  '/platform',
  '/trade-examples',
  '/privacy-policy',
  '/terms-of-service',
  '/disclaimer',
];

export const makeMetadata = ({
  title,
  description,
  path,
  keywords = seoKeywords,
  image = '/og/tradevision-ai-home.png',
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
}): Metadata => {
  const url = `${siteUrl}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'TradeVision AI',
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
};

export const faqItems = [
  {
    question: 'What is TradeVision AI?',
    answer: 'TradeVision AI is an AI trading platform for chart screenshot analysis, Trade Radar monitoring, Orion AI mentorship, journaling, and trader community workflows.',
  },
  {
    question: 'How does AI chart analysis work?',
    answer: 'You upload a chart screenshot, add market context, and TradeVision reviews visible structure, trend, key levels, risk zones, and possible trade scenarios.',
  },
  {
    question: 'Can beginners use TradeVision?',
    answer: 'Yes. Orion AI explains market structure, risk, confirmation, and platform workflows in plain language so newer traders can learn while reviewing charts.',
  },
  {
    question: 'What is Trade Radar?',
    answer: 'Trade Radar tracks setups created from analysis and helps traders wait for confirmation by monitoring status, confidence, and distance to entry.',
  },
  {
    question: 'What is Orion AI?',
    answer: 'Orion AI is the built-in trading mentor that helps users navigate TradeVision, understand analysis, create support tickets, and learn trading concepts.',
  },
  {
    question: 'Can I analyze forex charts?',
    answer: 'Yes. TradeVision supports forex chart screenshots and can help review pairs such as EUR/USD, GBP/JPY, USD/JPY, and other major or minor pairs.',
  },
  {
    question: 'Can I analyze synthetic indices?',
    answer: 'Yes. TradeVision can review synthetic indices screenshots, including boom, crash, volatility, and related synthetic market charts.',
  },
  {
    question: 'How accurate is AI analysis?',
    answer: 'AI analysis is educational decision support, not financial advice. Accuracy depends on chart quality, context, market conditions, and user risk management.',
  },
];

export const blogArticles = [
  {
    slug: 'what-is-ai-trading-analysis',
    title: 'What Is AI Trading Analysis?',
    metaTitle: 'What Is AI Trading Analysis? | TradeVision AI',
    metaDescription: 'Learn how AI trading analysis helps traders review charts, market structure, risk zones, and confirmation without replacing judgment.',
    focusKeyword: 'AI trading analysis',
    excerpt: 'A practical introduction to AI trading analysis and how traders can use it as structured decision support.',
    sections: [
      ['What AI trading analysis means', 'AI trading analysis uses software to review chart screenshots, price structure, key levels, and possible scenarios. The goal is not to guarantee trades, but to organize visible information so traders can make calmer decisions.'],
      ['Where it helps most', 'It is useful when traders need a second read on trend, support, resistance, liquidity, invalidation, and whether a setup needs confirmation.'],
      ['How TradeVision fits', 'TradeVision combines chart analysis, Orion AI mentorship, Trade Radar, and journaling so traders can move from idea to review in one workflow.'],
    ],
  },
  {
    slug: 'how-to-analyze-trading-charts-using-ai',
    title: 'How To Analyze Trading Charts Using AI',
    metaTitle: 'How To Analyze Trading Charts Using AI | TradeVision AI',
    metaDescription: 'A step-by-step guide to uploading a chart screenshot and using AI to review trend, structure, levels, and risk.',
    focusKeyword: 'AI chart analysis',
    excerpt: 'Use AI chart analysis to turn screenshots into a structured market read.',
    sections: [
      ['Start with a clear screenshot', 'Use a clean chart image where price, timeframe, and important levels are visible. Avoid cropped or blurry screenshots.'],
      ['Review structure first', 'AI should identify trend, range, breakouts, support, resistance, and invalidation before discussing entries.'],
      ['Track the idea', 'After analysis, send the setup to Trade Radar so it can be monitored while you wait for confirmation.'],
    ],
  },
  {
    slug: 'best-ai-tools-for-forex-traders',
    title: 'Best AI Tools For Forex Traders',
    metaTitle: 'Best AI Tools For Forex Traders | TradeVision AI',
    metaDescription: 'See what forex traders should look for in AI tools: chart analysis, risk planning, journaling, mentoring, and setup tracking.',
    focusKeyword: 'AI forex analysis',
    excerpt: 'Forex traders benefit most from AI tools that combine analysis, education, and patience-building workflows.',
    sections: [
      ['Chart screenshot analysis', 'Forex AI tools should explain trend, market structure, price zones, and confirmation instead of only producing buy or sell labels.'],
      ['Risk and journal support', 'The strongest tools help users log trades, review mistakes, and improve consistency over time.'],
      ['Mentorship matters', 'Orion AI helps explain why a market read matters, which is especially useful for newer forex traders.'],
    ],
  },
  {
    slug: 'understanding-market-structure',
    title: 'Understanding Market Structure',
    metaTitle: 'Understanding Market Structure | TradeVision AI',
    metaDescription: 'Learn the basics of market structure, including trend, ranges, breakouts, higher highs, lower lows, and confirmation.',
    focusKeyword: 'market structure',
    excerpt: 'Market structure is the foundation of cleaner technical analysis.',
    sections: [
      ['Why structure comes first', 'Before looking for a trade, traders should understand whether price is trending, ranging, transitioning, or breaking structure.'],
      ['Key ideas', 'Higher highs, higher lows, lower highs, lower lows, support, resistance, and liquidity areas help traders frame risk.'],
      ['Using AI to learn faster', 'TradeVision can describe visible market structure and Orion can explain the concepts in simpler language.'],
    ],
  },
  {
    slug: 'how-trade-radar-helps-traders-wait-for-confirmation',
    title: 'How Trade Radar Helps Traders Wait For Confirmation',
    metaTitle: 'How Trade Radar Helps Traders Wait For Confirmation | TradeVision AI',
    metaDescription: 'Learn how Trade Radar monitors setups from AI analysis so traders can wait for entry readiness and avoid forcing trades.',
    focusKeyword: 'trade radar',
    excerpt: 'Trade Radar is built for patience, monitoring, and setup follow-through.',
    sections: [
      ['The patience problem', 'Many traders see a good area and enter too early. Monitoring the setup helps reduce rushed decisions.'],
      ['What Trade Radar tracks', 'Trade Radar follows status, confidence, distance to entry, and timeline updates from active analysis setups.'],
      ['Better workflow', 'Analyze the chart, send it to radar, wait for confirmation, then journal the outcome.'],
    ],
  },
  {
    slug: 'how-orion-ai-helps-traders-learn-faster',
    title: 'How Orion AI Helps Traders Learn Faster',
    metaTitle: 'How Orion AI Helps Traders Learn Faster | TradeVision AI',
    metaDescription: 'Discover how Orion AI acts as a trading mentor for platform guidance, analysis explanations, and trading education.',
    focusKeyword: 'trading mentor AI',
    excerpt: 'Orion AI turns analysis into learning by explaining the reasoning behind each market read.',
    sections: [
      ['A mentor inside the platform', 'Orion helps users understand features, analysis results, risk language, and trading concepts without leaving TradeVision.'],
      ['Page-aware guidance', 'Because Orion is aware of the current workspace, it can route users to analysis, Trade Radar, support, journal, and billing workflows.'],
      ['Learning through repetition', 'Repeated explanations help traders recognize common structure, risk, and confirmation patterns.'],
    ],
  },
  {
    slug: 'gold-trading-analysis-guide',
    title: 'Gold Trading Analysis Guide',
    metaTitle: 'Gold Trading Analysis Guide | TradeVision AI',
    metaDescription: 'A practical guide to gold trading analysis using trend, liquidity, key levels, volatility, and AI chart review.',
    focusKeyword: 'AI gold analysis',
    excerpt: 'Gold requires careful structure and risk review because volatility can expand quickly.',
    sections: [
      ['Respect volatility', 'Gold can move aggressively around sessions and news. Traders should define invalidation and risk before entries.'],
      ['Key levels matter', 'Previous highs, lows, liquidity sweeps, and reaction zones are important context for gold chart analysis.'],
      ['Using TradeVision', 'Upload a gold chart to get a structured read and send strong ideas to Trade Radar for monitoring.'],
    ],
  },
  {
    slug: 'synthetic-indices-trading-guide',
    title: 'Synthetic Indices Trading Guide',
    metaTitle: 'Synthetic Indices Trading Guide | TradeVision AI',
    metaDescription: 'Learn how to approach synthetic indices analysis using clean screenshots, structure, risk, and AI-assisted review.',
    focusKeyword: 'synthetic indices analysis',
    excerpt: 'Synthetic indices traders can use AI to review structure, zones, and patience before execution.',
    sections: [
      ['Start with structure', 'Boom, crash, volatility, and related synthetic indices still need trend, range, and level review.'],
      ['Avoid overtrading', 'Fast-moving synthetic markets can tempt frequent entries. Journaling and confirmation rules help control behavior.'],
      ['AI as a review layer', 'TradeVision helps traders organize what is visible on the chart and track opportunities without chasing.'],
    ],
  },
  {
    slug: 'forex-risk-management-guide',
    title: 'Forex Risk Management Guide',
    metaTitle: 'Forex Risk Management Guide | TradeVision AI',
    metaDescription: 'Learn forex risk management basics: position sizing, stop placement, invalidation, risk-reward, and trade journaling.',
    focusKeyword: 'forex risk management',
    excerpt: 'Good forex analysis needs risk management before trade execution.',
    sections: [
      ['Risk comes before entry', 'A trade idea is incomplete until the trader knows invalidation, position size, and risk-reward.'],
      ['Use journals to improve', 'Logging outcomes and emotions helps reveal patterns like early entries, overtrading, and oversized risk.'],
      ['Let AI support review', 'TradeVision can help frame risk zones, while Orion explains why discipline matters.'],
    ],
  },
  {
    slug: 'common-trading-mistakes-beginners-make',
    title: 'Common Trading Mistakes Beginners Make',
    metaTitle: 'Common Trading Mistakes Beginners Make | TradeVision AI',
    metaDescription: 'Review common beginner trading mistakes including overtrading, no plan, poor risk control, and ignoring market structure.',
    focusKeyword: 'beginner trading mistakes',
    excerpt: 'Most beginner trading mistakes come from rushing, unclear structure, or weak risk habits.',
    sections: [
      ['Entering without confirmation', 'Beginners often enter because price is near a level, not because the setup is confirmed.'],
      ['Ignoring invalidation', 'Every trade idea needs a clear point where the idea is wrong.'],
      ['Not reviewing trades', 'A journal helps traders identify repeated mistakes and build a cleaner process.'],
    ],
  },
];

export const programmaticSeoPages = [
  {
    slug: 'forex-analysis',
    title: 'AI Forex Analysis',
    metaTitle: 'AI Forex Analysis | TradeVision AI',
    description: 'Upload forex chart screenshots and get AI-assisted analysis of market structure, trend, key levels, and risk scenarios.',
    keyword: 'AI forex analysis',
    h1: 'AI Forex Analysis For Chart Screenshots',
    cta: 'Upload Your First Forex Chart',
  },
  {
    slug: 'gold-analysis',
    title: 'AI Gold Analysis',
    metaTitle: 'AI Gold Analysis | TradeVision AI',
    description: 'Use TradeVision AI to review gold charts, liquidity zones, volatility, support, resistance, and confirmation plans.',
    keyword: 'AI gold analysis',
    h1: 'AI Gold Analysis For XAU/USD Traders',
    cta: 'Analyze A Gold Chart',
  },
  {
    slug: 'crypto-analysis',
    title: 'AI Crypto Analysis',
    metaTitle: 'AI Crypto Analysis | TradeVision AI',
    description: 'Review crypto chart screenshots with AI-assisted market structure, key levels, trend context, and risk planning.',
    keyword: 'AI crypto analysis',
    h1: 'AI Crypto Analysis For Cleaner Market Reads',
    cta: 'Upload A Crypto Chart',
  },
  {
    slug: 'synthetic-indices-analysis',
    title: 'Synthetic Indices Analysis',
    metaTitle: 'Synthetic Indices Analysis | TradeVision AI',
    description: 'Analyze synthetic indices screenshots with AI support for structure, levels, confirmation, and risk-first decision making.',
    keyword: 'synthetic indices analysis',
    h1: 'Synthetic Indices Analysis With TradeVision AI',
    cta: 'Analyze Synthetic Indices',
  },
  {
    slug: 'market-structure',
    title: 'Market Structure AI',
    metaTitle: 'Market Structure AI | TradeVision AI',
    description: 'Learn and review market structure with AI explanations for trend, ranges, breaks, liquidity, and invalidation.',
    keyword: 'market structure AI',
    h1: 'Market Structure Analysis With Orion AI',
    cta: 'Learn Market Structure',
  },
  {
    slug: 'trading-mentor',
    title: 'Trading Mentor AI',
    metaTitle: 'Trading Mentor AI | TradeVision AI',
    description: 'Meet Orion AI, the built-in trading mentor that explains analysis, risk, platform workflows, and trading concepts.',
    keyword: 'trading mentor AI',
    h1: 'Trading Mentor AI For Faster Learning',
    cta: 'Meet Orion AI',
  },
];

export const jsonLd = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TradeVision AI',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    sameAs: [siteUrl],
  },
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TradeVision AI',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/blog?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TradeVision AI',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '10000',
    },
  },
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
