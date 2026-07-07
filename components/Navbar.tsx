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
  { label: 'AI Analysis', href: '/analysis' },
  { label: 'Trade Radar', href: '/trade-radar' },
  { label: 'Orion', href: '/orion' },
  { label: 'Community', href: '/community' },
  { label: 'Blog', href: '/blog' },
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

  const isDark = colorMode === 'dark';
  const navShellClass = isDark
    ? 'fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#07111f]/92 text-white backdrop-blur-xl'
    : 'fixed left-0 right-0 top-0 z-50 border-b border-[#E5E7EB] bg-white/92 text-[#07111f] backdrop-blur-xl';
  const navLinkClass = isDark
    ? 'text-[13px] font-semibold text-slate-300 transition-colors hover:text-white'
    : 'text-[13px] font-semibold text-[#374151] transition-colors hover:text-[#2563EB]';
  const iconButtonClass = isDark
    ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-blue-300/35 hover:text-blue-200'
    : 'flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#2563EB] hover:text-[#2563EB]';
  const ghostButtonClass = isDark
    ? 'min-h-10 border-0 bg-transparent px-3 text-slate-200 hover:bg-white/[0.06] hover:text-white'
    : 'min-h-10 border-0 bg-transparent px-3 text-[#374151] hover:bg-[#F3F4F6]';
  const mobileLinkClass = isDark
    ? 'flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-slate-200 hover:border-white/10 hover:bg-white/[0.06]'
    : 'flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-[#374151] hover:border-[#E5E7EB] hover:bg-[#F7F9FC]';

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        className={navShellClass}
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
                  className={navLinkClass}
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
                  className={iconButtonClass}
                  aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className={ghostButtonClass}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Workspace
                  </Button>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className={ghostButtonClass}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1' : 'flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-2 py-1'}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#176dff]/20 text-[#60a5ff]">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} className={isDark ? 'h-8 w-8 border-0 bg-transparent text-slate-200 hover:bg-white/[0.08]' : 'h-8 w-8 border-0 bg-transparent text-[#374151] hover:bg-[#F3F4F6]'}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-5">
                <button
                  type="button"
                  onClick={toggleColorMode}
                  className={iconButtonClass}
                  aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')} className={isDark ? 'h-10 min-h-10 border-0 bg-transparent px-0 text-[13px] font-semibold normal-case tracking-0 text-slate-200 shadow-none hover:bg-transparent hover:text-white' : 'h-10 min-h-10 border-0 bg-transparent px-0 text-[13px] font-semibold normal-case tracking-0 text-[#374151] shadow-none hover:bg-transparent hover:text-[#2563EB]'}>
                  Log In
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openAuth('register')} className="h-10 min-h-10 rounded-xl border-0 bg-[#2563EB] px-7 text-[13px] font-bold normal-case tracking-0 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:bg-[#1D4ED8]">
                  Start Free
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className={isDark ? 'flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100 md:hidden' : 'flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] md:hidden'} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={isDark ? 'border-t border-white/10 bg-[#07111f]/98 backdrop-blur-2xl md:hidden' : 'border-t border-[#E5E7EB] bg-white/98 backdrop-blur-2xl md:hidden'}
          >
            <div className="page-shell flex flex-col gap-2 py-4">
              <button
                type="button"
                onClick={toggleColorMode}
                className={isDark ? 'flex min-h-12 items-center gap-3 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-200' : 'flex min-h-12 items-center gap-3 rounded-xl border border-[#E5E7EB] px-4 text-sm font-semibold text-[#374151]'}
              >
                {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                    Workspace
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button className={isDark ? 'flex min-h-12 items-center rounded-xl border border-transparent px-4 text-left text-sm font-semibold text-red-300 hover:border-red-500/20 hover:bg-white/[0.06]' : 'flex min-h-12 items-center rounded-xl border border-transparent px-4 text-left text-sm font-semibold text-red-600 hover:border-red-200 hover:bg-red-50'} onClick={() => { logout(); setMobileOpen(false); }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className={isDark ? 'mt-2 w-full border-white/10 bg-transparent text-slate-100' : 'mt-2 w-full border-[#E5E7EB] bg-transparent text-[#374151]'} onClick={() => { openAuth('login'); setMobileOpen(false); }}>
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
