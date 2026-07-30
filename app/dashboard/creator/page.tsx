'use client';

import { useAuth } from '@/app/auth-provider';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'content_maker') {
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

  if (!user || user.role !== 'content_maker') {
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
              Welcome back, <span className="text-primary">{user.name}</span>!
            </h1>
            <p className="text-xl text-muted-foreground">
              You're set up as a Content Creator. Start sharing your food experiences with the community!
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Upload Video Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload Video</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share food videos from your favorite restaurants
              </p>
              <Link href="/dashboard/creator/upload">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Analytics Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View your video performance and engagement metrics
              </p>
              <Link href="/dashboard/creator/analytics">
                <Button variant="outline" className="w-full">View Analytics</Button>
              </Link>
            </div>

            {/* My Videos Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">My Videos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage and edit your uploaded food videos
              </p>
              <Link href="/dashboard/creator/videos">
                <Button variant="outline" className="w-full">View Videos</Button>
              </Link>
            </div>

            {/* Followers Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Followers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See who's following your food content
              </p>
              <Link href="/dashboard/creator/followers">
                <Button variant="outline" className="w-full">View Followers</Button>
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-border">
            <h2 className="text-2xl font-bold mb-6">Your Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Videos</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Views</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Likes</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Followers</p>
                <p className="text-4xl font-bold text-primary">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
