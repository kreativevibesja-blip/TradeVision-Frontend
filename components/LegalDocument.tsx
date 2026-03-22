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
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{intro}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-slate-500">Effective date: {effectiveDate}</p>
        </div>

        <div className="space-y-6 pb-10">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}