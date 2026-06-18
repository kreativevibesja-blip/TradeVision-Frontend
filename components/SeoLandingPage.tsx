import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function SeoLandingPage({
  eyebrow,
  title,
  description,
  sections,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{ title: string; body: string; href?: string; linkLabel?: string }>;
  cta: string;
}) {
  return (
    <div className="bg-[#F7F9FC] text-[#111827]">
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#2563EB]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4B5563]">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyze" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-extrabold text-white">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-sm font-extrabold text-[#111827]">View Pricing</Link>
            <Link href="/blog" className="inline-flex h-12 items-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-sm font-extrabold text-[#111827]">Read Blog</Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
              <CheckCircle2 className="h-5 w-5 text-[#2563EB]" />
              <h2 className="mt-4 text-xl font-extrabold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4B5563]">{section.body}</p>
              {section.href ? (
                <Link href={section.href} className="mt-4 inline-flex text-sm font-extrabold text-[#2563EB]">{section.linkLabel || 'Learn more'}</Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
