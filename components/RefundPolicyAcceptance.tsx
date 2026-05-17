'use client';

import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NO_REFUND_POLICY_TITLE, NO_REFUND_POLICY_VERSION } from '@/lib/refundPolicy';

type RefundPolicyAcceptanceProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const nonRefundableReasons = [
  'Change of mind',
  'Trading losses',
  'Failure to use platform',
  'Unused subscription time',
  'User setup errors',
  'Broker issues',
  'VPS issues',
  'Performance expectations',
];

export function RefundPolicyAcceptance({ checked, onCheckedChange }: RefundPolicyAcceptanceProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-[24px] border border-[rgba(255,223,112,0.12)] bg-[linear-gradient(135deg,rgba(255,223,112,0.08),rgba(15,23,42,0.92))] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <input
            id="refund-policy-acceptance"
            type="checkbox"
            checked={checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-amber-400 focus:ring-amber-400"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor="refund-policy-acceptance" className="cursor-pointer text-sm font-medium leading-6 text-white">
              I understand that all digital subscriptions are final and non-refundable.
            </label>
            <p className="mt-1 text-sm leading-6 text-white/72">
              By continuing, I agree to the{' '}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="font-medium text-amber-300 underline decoration-amber-300/70 underline-offset-4 transition hover:text-amber-200"
              >
                No Refund Policy
              </button>
              .
            </p>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-200/70">
              Policy version {NO_REFUND_POLICY_VERSION}
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[rgba(255,223,112,0.14)] bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Billing Policy
                </div>
                <h3 className="text-xl font-semibold text-white">{NO_REFUND_POLICY_TITLE}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Close refund policy modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm leading-7 text-white/78 sm:px-6">
              <p>By subscribing to any TradeVision or GoldX plan, you acknowledge and agree that all payments are final and non-refundable.</p>
              <p>Due to the digital nature of our platform, instant access to proprietary trading tools, AI analysis systems, trading automation, educational resources, cloud services, and premium content is granted immediately.</p>
              <div>
                <p className="mb-2">We do not offer refunds, partial refunds, credits, or chargebacks for:</p>
                <ul className="space-y-1 text-white/72">
                  {nonRefundableReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </div>
              <p>Subscribers may cancel future renewals at any time.</p>
              <p>Cancellation stops future billing only.</p>
              <p>Access remains active until the end of the current billing cycle.</p>
              <p>TradeVision and GoldX do not guarantee profits.</p>
              <p>Trading involves risk.</p>
              <p>By completing payment, you confirm acceptance of this policy.</p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={() => {
                  onCheckedChange(true);
                  setOpen(false);
                }}
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
