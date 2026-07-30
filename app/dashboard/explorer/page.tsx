'use client';

import { useAuth } from '@/app/auth-provider';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Compass, Heart, Bookmark, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExplorerDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'user') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'user') {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container px-4 md:px-6 py-12">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to your food adventure, <span className="text-primary">{user.name}</span>!
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore authentic food experiences and discover amazing restaurants near you.
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Discover Videos Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Compass className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Discover Videos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore food videos from creators around you
              </p>
              <Link href="/">
                <Button className="w-full">Start Exploring</Button>
              </Link>
            </div>

            {/* Favorites Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">My Favorites</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View videos and restaurants you've liked
              </p>
              <Link href="/dashboard/explorer/favorites">
                <Button variant="outline" className="w-full">View Favorites</Button>
              </Link>
            </div>

            {/* Saved Items Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Bookmark className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Saved for Later</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bookmarked videos and restaurants to visit
              </p>
              <Link href="/dashboard/explorer/saved">
                <Button variant="outline" className="w-full">View Saved</Button>
              </Link>
            </div>

            {/* Following Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Following</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Creators you're following and their latest videos
              </p>
              <Link href="/dashboard/explorer/following">
                <Button variant="outline" className="w-full">View Following</Button>
              </Link>
            </div>
          </div>

          {/* Featured Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-border">
            <h2 className="text-2xl font-bold mb-6">Your Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Videos Liked</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Videos Saved</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Creators Following</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Restaurants Discovered</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
