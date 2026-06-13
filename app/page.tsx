'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Check,
  Globe2,
  GraduationCap,
  Headphones,
  LineChart,
  Play,
  ShieldCheck,
  UploadCloud,
  Zap,
} from 'lucide-react';

const trustItems = [
  {
    title: 'Secure & Reliable',
    body: 'Bank-level security keeps your data protected.',
    icon: ShieldCheck,
  },
  {
    title: 'Fast Analysis',
    body: 'Get AI-powered insights in seconds.',
    icon: Zap,
  },
  {
    title: 'Multi-Market',
    body: 'Forex, Gold, Crypto, Indices & Synthetic Indices.',
    icon: Globe2,
  },
  {
    title: '24/7 Support',
    body: "We're here to help you succeed.",
    icon: Headphones,
  },
];

const steps = [
  {
    title: 'Upload Chart',
    body: 'Upload a screenshot from MT5, TradingView or any platform.',
    icon: UploadCloud,
    tone: 'bg-[#1f6fff]',
  },
  {
    title: 'AI Analysis',
    body: 'Orion AI analyzes market structure, key levels and trade opportunities.',
    icon: Brain,
    tone: 'bg-[#7c4dff]',
  },
  {
    title: 'Improve',
    body: 'Use insights and Trade Radar to track, plan and improve your trading.',
    icon: LineChart,
    tone: 'bg-[#16b761]',
  },
];

const features = [
  'AI Chart Analysis',
  'Trade Radar Tracking',
  'Smart Journal',
  'Market Intelligence',
  'Orion AI Chat',
];

const mentorHighlights = [
  {
    title: 'Explains market structure in simple terms.',
    icon: GraduationCap,
  },
  {
    title: 'Guides your risk-first management.',
    icon: ShieldCheck,
  },
  {
    title: 'Helps you understand key concepts.',
    icon: Check,
  },
  {
    title: 'Improves your mindset and consistency.',
    icon: Brain,
  },
];

const plans = [
  {
    name: 'Free',
    subtitle: 'Explore TradeVision',
    price: '$0',
    cadence: 'Forever',
    cta: 'Get Started',
    href: '/analyze',
    features: ['2 Analyses per day', 'Basic AI insights', 'Access to Orion Chat'],
  },
  {
    name: 'Pro Weekly',
    subtitle: 'Full Access',
    price: '$9.95',
    cadence: '/week',
    cta: 'Start Free Trial',
    href: '/checkout?plan=PRO',
    features: ['Unlimited Analyses', 'Trade Radar Access', 'Smart Journal', 'Priority Support'],
  },
  {
    name: 'Pro Monthly',
    subtitle: 'Full Access',
    price: '$39.95',
    cadence: '/month',
    cta: 'Start Free Trial',
    href: '/checkout?plan=PRO_MONTHLY',
    featured: true,
    features: ['Unlimited Analyses', 'Trade Radar Access', 'Smart Journal', 'Priority Support'],
  },
];

const avatarGradient = [
  'from-slate-300 to-slate-500',
  'from-amber-200 to-amber-500',
  'from-stone-300 to-stone-500',
  'from-rose-200 to-rose-400',
  'from-orange-100 to-orange-300',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#07111f]">
      <section className="relative overflow-hidden bg-[#020916] pb-16 pt-4 text-white sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_32%,rgba(27,108,255,0.45),transparent_28%),radial-gradient(circle_at_52%_56%,rgba(40,88,255,0.28),transparent_26%),linear-gradient(145deg,#020916_0%,#030a18_48%,#06194a_100%)]" />
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(115deg,transparent_0%,transparent_54%,rgba(48,115,255,0.34)_54.3%,transparent_55.2%),linear-gradient(125deg,transparent_0%,transparent_61%,rgba(48,115,255,0.24)_61.4%,transparent_62.2%)]" />

        <div className="page-shell relative z-10">
          <div className="grid min-h-[470px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="pt-8 sm:pt-12">
              <div className="mb-4 inline-flex rounded-full bg-[linear-gradient(90deg,#0e67d8,#7448d7)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#dcecff]">
                AI-powered trading intelligence
              </div>

              <h1 className="max-w-[560px] text-[3rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-white sm:text-[4.5rem] lg:text-[5rem]">
                Become A More <span className="bg-[linear-gradient(90deg,#7e58ff_0%,#3293ff_100%)] bg-clip-text text-transparent">Confident Trader.</span>
              </h1>
              <p className="mt-5 max-w-[540px] text-lg leading-8 text-white/88">
                TradeVision AI helps traders analyze charts, understand market structure, and improve decision-making with AI-powered insights.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/analyze"
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-[#146dff] px-8 text-sm font-bold text-white shadow-[0_16px_32px_rgba(20,109,255,0.3)] transition hover:bg-[#0d5ee5]"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/platform"
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl border border-white/45 bg-transparent px-8 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3">
                  {avatarGradient.map((tone, index) => (
                    <div key={tone} className={`h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br ${tone}`}>
                      <div className="mx-auto mt-2 h-3 w-3 rounded-full bg-white/75" />
                      <div className="mx-auto mt-1 h-3 w-5 rounded-t-full bg-black/20" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-lg leading-none text-[#ffce37]">*****</div>
                  <div className="mt-1 text-sm font-semibold text-white">Trusted by 10,000+ traders worldwide</div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <Image
                src="/landing/hero-devices.png"
                alt="TradeVision AI dashboard shown on laptop and phone"
                width={560}
                height={372}
                priority
                className="w-full max-w-[680px] object-contain drop-shadow-[0_32px_38px_rgba(0,0,0,0.42)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="relative z-20 -mt-12 px-4">
        <div className="mx-auto grid max-w-6xl gap-4 rounded-[14px] border border-[#e5ecfb] bg-white p-5 shadow-[0_18px_55px_rgba(28,61,121,0.16)] sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {trustItems.map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3f7ff] text-[#176dff]">
                <item.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">{item.title}</h3>
                <p className="mt-1 text-sm leading-5 text-[#4a5669]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-4 pb-14 pt-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#176dff]">How it works</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Simple. Fast. Powerful.</h2>

          <div className="mt-8 grid items-center gap-6 lg:grid-cols-[1fr_56px_1fr_56px_1fr]">
            {steps.map((step, index) => (
              <div key={step.title} className="contents">
                <div className="rounded-[12px] border border-[#e6edf8] bg-white p-7 text-left shadow-[0_14px_35px_rgba(44,70,120,0.08)]">
                  <div className="flex items-center gap-5">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${step.tone} text-white`}>
                      <step.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#4a5669]">{step.body}</p>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <div className="hidden items-center justify-center lg:flex">
                    <div className="h-px w-full border-t border-dashed border-[#b9cff8]" />
                    <div className="-ml-1 h-2 w-2 rounded-full bg-[#1f6fff]" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#f4f8ff] px-4 py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.42fr_0.58fr]">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#176dff]">Built for traders</div>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">Everything You Need. All In One Platform.</h2>
            <p className="mt-4 text-base leading-7 text-[#4a5669]">
              Powerful tools designed to help you analyze, track and improve your trading performance.
            </p>
            <div className="mt-6 space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm font-semibold text-[#223047]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#176dff] text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
            <Link href="/platform" className="mt-7 inline-flex h-12 items-center rounded-xl bg-[#176dff] px-7 text-sm font-bold text-white shadow-[0_14px_28px_rgba(23,109,255,0.22)]">
              Explore The Platform
            </Link>
          </div>

          <Image
            src="/landing/platform-dashboard.png"
            alt="TradeVision AI platform dashboard"
            width={574}
            height={266}
            className="w-full rounded-[8px] shadow-[0_24px_55px_rgba(8,25,56,0.22)]"
          />
        </div>
      </section>

      <section id="about" className="overflow-hidden bg-[linear-gradient(105deg,#031744_0%,#04246d_48%,#351889_100%)] px-4 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.22fr_0.28fr_0.5fr]">
          <Image
            src="/landing/orion-mentor.png"
            alt="Orion AI trading mentor"
            width={206}
            height={145}
            className="mx-auto w-[210px] self-end lg:mx-0"
          />
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.04em]">Meet Orion</h2>
            <div className="mt-1 text-2xl font-extrabold text-[#3293ff]">Your Personal Trading Mentor</div>
            <p className="mt-4 text-base leading-7 text-white/88">
              Orion doesn&apos;t just analyze charts. Orion teaches, guides and helps you become a better trader.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {mentorHighlights.map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/8 text-[#bca7ff]">
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="text-sm leading-6 text-white/90">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-4 py-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#176dff]">Pricing</div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Simple Pricing. No Hidden Fees.</h2>

          <div className="mt-6 grid gap-6 text-left lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-[10px] border bg-white p-5 shadow-[0_10px_28px_rgba(37,61,110,0.08)] ${plan.featured ? 'border-[#176dff]' : 'border-[#e2e9f5]'}`}>
                {plan.featured ? (
                  <div className="absolute -top-3 left-8 right-8 rounded-full bg-[#176dff] py-1 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">Best value</div>
                ) : null}
                <h3 className="text-base font-extrabold">{plan.name}</h3>
                <p className="mt-1 text-xs text-[#5b6678]">{plan.subtitle}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-3xl font-extrabold tracking-[-0.05em]">{plan.price}</span>
                  <span className="pb-1 text-sm text-[#5b6678]">{plan.cadence}</span>
                </div>
                <div className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs font-semibold text-[#223047]">
                      <Check className="h-3.5 w-3.5 text-[#176dff]" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  href={plan.href}
                  className={`mt-6 flex h-10 items-center justify-center rounded-lg border text-xs font-extrabold ${plan.featured ? 'border-[#176dff] bg-[#176dff] text-white' : 'border-[#176dff] text-[#176dff]'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-4 pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-[10px] bg-[linear-gradient(100deg,#031744_0%,#05246c_100%)] px-8 py-6 text-white shadow-[0_16px_38px_rgba(4,21,65,0.22)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div className="hidden h-16 w-16 items-center justify-center rounded-full border border-[#3293ff]/40 text-[#3293ff] sm:flex">
              <LineChart className="h-9 w-9" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.04em]">Start Improving Your Trading Today</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/82">
                Join thousands of traders using TradeVision AI to trade smarter and with more confidence.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/analyze" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#176dff] px-7 text-sm font-bold text-white">
              Start Free Today
            </Link>
            <Link href="/platform" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/35 px-7 text-sm font-bold text-white">
              View Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
