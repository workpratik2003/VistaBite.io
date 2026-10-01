/**
 * VistaBite Add Reel Page (stub)
 * /add-reel
 *
 * PROTECTED — verifies session server-side before rendering.
 * Add Reel functionality is Phase 2+.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Reel – VistaBite',
  description: 'Save a restaurant from an Instagram Reel.',
};

export default async function AddReelPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const parsedCookies = parseCookies(cookieHeader);
  const token = parsedCookies[getSessionCookieName()];

  if (!token) {
    redirect('/login?redirect=/add-reel');
  }

  const user = await getSessionUser(token);
  if (!user) {
    redirect('/login?redirect=/add-reel');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="relative z-10 max-w-xl w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Plus className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">Add a Reel</h1>
        <p className="text-muted-foreground mb-2">
          Hi <span className="font-medium text-foreground">{user.name ?? user.email}</span>!
        </p>
        <p className="text-muted-foreground">
          Instagram Reel ingestion and spot extraction is coming in the next phase.
        </p>
      </div>
    </div>
  );
}
