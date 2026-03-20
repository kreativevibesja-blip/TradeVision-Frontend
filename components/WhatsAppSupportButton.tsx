'use client';

import { MessageCircle } from 'lucide-react';

const whatsappUrl = 'https://wa.me/18762797956?text=Hi%20TradeVision%20AI%2C%20I%20need%20support.';

export function WhatsAppSupportButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact support on WhatsApp"
      className="fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500 text-white shadow-[0_18px_45px_rgba(16,185,129,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-background md:bottom-6 md:right-6 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 md:h-7 md:w-7">
        <MessageCircle className="h-5 w-5 md:h-4 md:w-4" />
      </span>
      <span className="hidden md:inline text-[10px] font-semibold tracking-[0.08em] uppercase">WhatsApp Support</span>
    </a>
  );
}