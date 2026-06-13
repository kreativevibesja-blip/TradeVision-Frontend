import type { ReactNode } from 'react';

interface LegalSection {
  title: string;
  content: ReactNode;
}

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
}

export function LegalDocument({ eyebrow, title, intro, effectiveDate, sections }: LegalDocumentProps) {
  return (
    <div className="page-stack min-h-screen">
      <div className="page-shell max-w-4xl">
        <div className="mb-10 rounded-xl border border-[#1b3358] bg-[#071426] p-6 shadow-[0_18px_46px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#60a5ff]">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#b8c6d8] sm:text-base">{intro}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.14em] text-[#8ea4c2]">Effective date: {effectiveDate}</p>
        </div>

        <div className="space-y-6 pb-10">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border border-[#dce6f5] bg-white p-6 text-[#07111f] shadow-[0_12px_30px_rgba(29,53,92,0.07)] sm:p-8">
              <h2 className="text-xl font-extrabold tracking-[-0.03em] text-[#07111f]">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#46566b] sm:text-base">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
