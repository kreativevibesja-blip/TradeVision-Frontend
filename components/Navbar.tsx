'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,223,112,0.12)] bg-[rgba(5,5,5,0.72)] backdrop-blur-2xl"
      >
        <div className="page-shell flex h-20 items-center justify-between gap-4">
          <BrandLogo />

          {/* Desktop Nav */}
          <div className="hidden items-center gap-3 md:flex lg:gap-5">
            <div className="hidden items-center gap-1 rounded-full border border-[rgba(255,223,112,0.12)] bg-white/[0.03] p-1 lg:flex">
              <Link href="/analyze" className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
                Analyze
              </Link>
              <Link href="/platform" className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
                Platform
              </Link>
              <Link href="/trade-examples" className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
                Education
              </Link>
              <Link href="/pricing" className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
                Pricing
              </Link>
            </div>
            <Link href="/analyze" className="text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              Analyze
            </Link>
            <Link href="/platform" className="text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              Platform
            </Link>
            <Link href="/trade-examples" className="text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              Education
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              Pricing
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="min-h-11 gap-2">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="min-h-11 gap-2">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 rounded-full border border-[rgba(255,223,112,0.14)] bg-white/[0.03] px-2.5 py-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/18 text-primary">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="max-w-[10rem] truncate text-sm font-semibold text-white">{user.name || user.email.split('@')[0]}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{user.subscription}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} className="h-10 w-10">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                  Sign In
                </Button>
                <Button variant="gradient" size="sm" onClick={() => openAuth('register')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,223,112,0.18)] bg-white/[0.04] md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[rgba(255,223,112,0.12)] bg-[rgba(5,5,5,0.94)] backdrop-blur-2xl md:hidden"
          >
            <div className="page-shell flex flex-col gap-2 py-4">
              <div className="mb-3 premium-panel-muted p-4">
                <div className="premium-kicker mb-3">Command Surface</div>
                <p className="text-sm text-muted-foreground">Switch between analysis, pricing, education, and your workspace from one premium mobile menu.</p>
              </div>
              <Link href="/analyze" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                Analyze
              </Link>
              <Link href="/" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/pricing" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              <Link href="/platform" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                Platform
              </Link>
              <Link href="/trade-examples" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                Education
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-sm hover:border-[rgba(255,223,112,0.14)] hover:bg-white/[0.04]" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button className="flex min-h-12 items-center rounded-2xl border border-transparent px-4 text-left text-sm text-red-400 hover:border-red-500/20 hover:bg-white/[0.04]" onClick={() => { logout(); setMobileOpen(false); }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { openAuth('login'); setMobileOpen(false); }}>
                    Sign In
                  </Button>
                  <Button variant="gradient" size="sm" className="w-full" onClick={() => { openAuth('register'); setMobileOpen(false); }}>
                    Get Started
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
