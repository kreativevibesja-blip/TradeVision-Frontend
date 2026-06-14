'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';

const navLinks = [
  { label: 'AI Analysis', href: '/analyze' },
  { label: 'Intelligence', href: '/platform' },
  { label: 'Mentorship', href: '/trade-examples' },
  { label: 'Pricing', href: '/pricing' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('tradevision-color-mode');
    const initial = stored === 'dark' || stored === 'light' ? stored : 'light';
    setColorMode(initial);
    document.documentElement.dataset.colorMode = initial;
    document.body.dataset.colorMode = initial;
  }, []);

  const toggleColorMode = () => {
    const next = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(next);
    window.localStorage.setItem('tradevision-color-mode', next);
    document.documentElement.dataset.colorMode = next;
    document.body.dataset.colorMode = next;
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-[#E5E7EB] bg-white/92 backdrop-blur-xl"
      >
        <div className="page-shell flex h-16 items-center justify-between gap-6 lg:h-[68px]">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/landing/tradevision-logo.png"
              alt="TradeVision"
              width={140}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden flex-1 items-center justify-between gap-6 md:flex">
            <div className="flex flex-1 items-center justify-center gap-8 lg:gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-semibold text-[#374151] transition-colors hover:text-[#2563EB]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleColorMode}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                  aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="min-h-10 border-0 bg-transparent px-3 text-[#374151] hover:bg-[#F3F4F6]">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Workspace
                  </Button>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="min-h-10 border-0 bg-transparent px-3 text-[#374151] hover:bg-[#F3F4F6]">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-2 py-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#176dff]/20 text-[#60a5ff]">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 border-0 bg-transparent text-[#374151] hover:bg-[#F3F4F6]">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-5">
                <button
                  type="button"
                  onClick={toggleColorMode}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                  aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')} className="h-10 min-h-10 border-0 bg-transparent px-0 text-[13px] font-semibold normal-case tracking-0 text-[#374151] shadow-none hover:bg-transparent hover:text-[#2563EB]">
                  Log In
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openAuth('register')} className="h-10 min-h-10 rounded-xl border-0 bg-[#2563EB] px-7 text-[13px] font-bold normal-case tracking-0 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:bg-[#1D4ED8]">
                  Start Free
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[#E5E7EB] bg-white/98 backdrop-blur-2xl md:hidden"
          >
            <div className="page-shell flex flex-col gap-2 py-4">
              <button
                type="button"
                onClick={toggleColorMode}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-[#E5E7EB] px-4 text-sm font-semibold text-[#374151]"
              >
                {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-[#374151] hover:border-[#E5E7EB] hover:bg-[#F7F9FC]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/dashboard" className="flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-[#374151] hover:border-[#E5E7EB] hover:bg-[#F7F9FC]" onClick={() => setMobileOpen(false)}>
                    Workspace
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-[#374151] hover:border-[#E5E7EB] hover:bg-[#F7F9FC]" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button className="flex min-h-12 items-center rounded-xl border border-transparent px-4 text-left text-sm font-semibold text-red-300 hover:border-red-500/20 hover:bg-white/[0.06]" onClick={() => { logout(); setMobileOpen(false); }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="mt-2 w-full border-[#E5E7EB] bg-transparent text-[#374151]" onClick={() => { openAuth('login'); setMobileOpen(false); }}>
                    Log In
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full border-0 bg-[#2563EB] text-white hover:bg-[#1D4ED8]" onClick={() => { openAuth('register'); setMobileOpen(false); }}>
                    Start Free
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </>
  );
}
