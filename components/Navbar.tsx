'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import {
  BarChart3,
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
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl"
      >
        <div className="page-shell flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="truncate text-base font-bold text-gradient sm:text-lg">TradeVision AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6">
            <Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analyze
            </Link>
            <Link href="/platform" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Platform
            </Link>
            <Link href="/trade-examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Education
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="min-h-11">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="min-h-11">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{user.name || user.email.split('@')[0]}</span>
                  <Button variant="ghost" size="icon" onClick={logout}>
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
          <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="page-shell flex flex-col gap-2 py-4">
              <Link href="/analyze" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                Analyze
              </Link>
              <Link href="/" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/pricing" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              <Link href="/platform" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                Platform
              </Link>
              <Link href="/trade-examples" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                Education
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="flex min-h-12 items-center rounded-xl px-4 text-sm hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button className="flex min-h-12 items-center rounded-xl px-4 text-left text-sm text-red-400 hover:bg-white/5" onClick={() => { logout(); setMobileOpen(false); }}>
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
