'use client';

/**
 * VistaBite Navigation Bar
 *
 * Reads authentication state from /api/auth/me on mount.
 * Renders different nav items for logged-in vs. logged-out users:
 *
 * Logged out:  Home · Login · Register
 * Logged in:   Home · Add Reel · Favorites · Account · Logout
 *
 * The component never stores the session token — it only reads the `name`
 * and `authenticated` flag returned by the /me endpoint.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  BookmarkCheck,
  Plus,
  LogIn,
  LogOut,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';

interface AuthState {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export function Navbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: AuthState) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuth({ authenticated: false });
      router.push('/');
      router.refresh();
    } catch {
      // Even on network failure, clear local state
      setAuth({ authenticated: false });
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const displayName = auth?.user?.name ?? auth?.user?.email?.split('@')[0] ?? 'Account';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          id="nav-logo"
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
        >
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span className="text-lg tracking-tight">VistaBite</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {auth === null ? (
            /* Loading skeleton */
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          ) : auth.authenticated ? (
            <>
              <NavLink href="/add-reel" id="nav-add-reel" icon={<Plus className="h-4 w-4" />}>
                Add Reel
              </NavLink>
              <NavLink href="/favorites" id="nav-favorites" icon={<BookmarkCheck className="h-4 w-4" />}>
                Favorites
              </NavLink>
              <span className="mx-2 text-muted-foreground/50 text-sm">|</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground px-2">
                <UserCircle className="h-4 w-4" />
                {displayName}
              </span>
              <button
                id="nav-logout"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login" id="nav-login" icon={<LogIn className="h-4 w-4" />}>
                Login
              </NavLink>
              <Link
                href="/register"
                id="nav-register"
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                <UserCircle className="h-4 w-4" />
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          id="nav-mobile-toggle"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {auth?.authenticated ? (
            <>
              <MobileLink href="/add-reel" onClick={() => setMenuOpen(false)} icon={<Plus className="h-4 w-4" />}>
                Add Reel
              </MobileLink>
              <MobileLink href="/favorites" onClick={() => setMenuOpen(false)} icon={<BookmarkCheck className="h-4 w-4" />}>
                Favorites
              </MobileLink>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground px-2 mb-1">Signed in as {displayName}</p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </>
          ) : (
            <>
              <MobileLink href="/login" onClick={() => setMenuOpen(false)} icon={<LogIn className="h-4 w-4" />}>
                Login
              </MobileLink>
              <MobileLink href="/register" onClick={() => setMenuOpen(false)} icon={<UserCircle className="h-4 w-4" />}>
                Register
              </MobileLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  id,
  icon,
  children,
}: {
  href: string;
  id: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      id={id}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
