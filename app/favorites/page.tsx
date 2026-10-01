/**
 * VistaBite Favorites Page (stub)
 * /favorites
 *
 * This page is PROTECTED — requireUser() is called server-side before render.
 * If the session is invalid, the user is redirected to /login.
 *
 * FAVORITES CRUD is NOT yet implemented (Phase 2).
 * This stub exists to satisfy the navigation entry point requirement.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { BookmarkCheck, Plus, UtensilsCrossed } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Favorites – VistaBite',
  description: 'Your saved restaurants, cafes and food spots.',
};

export default async function FavoritesPage() {
  // Server-side session verification — not relying on client state
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const parsedCookies = parseCookies(cookieHeader);
  const token = parsedCookies[getSessionCookieName()];

  if (!token) {
    redirect('/login?redirect=/favorites');
  }

  const user = await getSessionUser(token);
  if (!user) {
    redirect('/login?redirect=/favorites');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <BookmarkCheck className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-3">
            Your Favorites
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Welcome, <span className="font-medium text-foreground">{user.name ?? user.email}</span>!
          </p>
          <p className="text-muted-foreground mb-12">
            Favorites functionality is coming soon in the next phase.
          </p>

          {/* Coming soon card */}
          <div className="bg-card border border-border rounded-2xl p-10 shadow-sm">
            <div className="flex justify-center mb-4">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
              You haven&apos;t saved any spots yet. Once Phase 2 is implemented, your
              favourite restaurants and food spots from Instagram Reels will appear here.
            </p>
            <Link
              href="/add-reel"
              id="favorites-add-reel-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Add your first Reel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
