'use client';

import { useState } from 'react';
import { Headphones, Send, Sparkles, UploadCloud } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

type Message = { role: 'orion' | 'user'; text: string };

export default function OrionPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'orion', text: 'Hi, I’m Orion. I can help you understand TradeVision, trading concepts, analysis results, radar setups, journal habits, and support workflows.' },
  ]);
  const [input, setInput] = useState('');

  const submit = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const known = /analysis|radar|journal|support|pricing|billing|community|feed|market structure|bos|choch|liquidity/i.test(trimmed);
    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      {
        role: 'orion',
        text: known
          ? 'Here’s the clean path: use AI Analysis to read the chart, send qualified setups to Trade Radar, then use Journal and Feed to review and discuss the idea.'
          : 'I’m not fully familiar with that yet. Would you like to speak with support?',
      },
    ]);
    setInput('');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Orion AI"
        subtitle="Internal, page-aware TradeVision mentor for navigation, trading concepts, support, and workflow guidance."
        action={<CleanButton href="/dashboard/support"><Headphones className="h-4 w-4" />Open Support</CleanButton>}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <CleanCard className="flex min-h-[68vh] flex-col p-0">
          <div className="border-b border-[#E5E7EB] p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-[#111827]"><Sparkles className="h-5 w-5 text-[#2563EB]" />Chat with Orion</h2>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#2563EB] text-white' : 'bg-[#F7F9FC] text-[#4B5563]'}`}>
                  {message.text}
                  {message.text.includes('speak with support') ? (
                    <div className="mt-3 flex gap-2">
                      <CleanButton href="/dashboard/support" className="h-9">Yes</CleanButton>
                      <CleanButton variant="secondary" className="h-9" onClick={() => submit('No, continue here')}>No</CleanButton>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-[#E5E7EB] p-4">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} className="h-11 flex-1 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Ask Orion..." />
            <CleanButton onClick={() => submit()}><Send className="h-4 w-4" />Send</CleanButton>
          </div>
        </CleanCard>
        <aside className="space-y-3">
          {['Analyze this chart', 'Explain market structure', 'Create a support ticket', 'Open Trade Radar'].map((action) => (
            <CleanButton key={action} variant="secondary" className="w-full justify-start" onClick={() => submit(action)}>
              <UploadCloud className="h-4 w-4" />
              {action}
            </CleanButton>
          ))}
        </aside>
      </div>
    </div>
  );
}
