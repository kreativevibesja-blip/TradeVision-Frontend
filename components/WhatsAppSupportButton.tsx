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
      className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-background md:bottom-6 md:right-6"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10">
        <MessageCircle className="h-5 w-5" />
      </span>
      <span className="hidden sm:inline">WhatsApp Support</span>
    </a>
  );
}