import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { BiteMapPage } from '@/components/bitemap/BiteMapPage';

export const metadata: Metadata = {
  title: 'My BiteMap – VistaBite',
  description:
    'Explore your saved restaurants, cafes and food spots on a map. Use your location to discover nearby saved places.',
};

export default async function FavoritesMapPage() {
  const cookieStore = await cookies();
  const token = parseCookies(cookieStore.toString())[getSessionCookieName()];
  if (!token) {
    redirect('/login?redirect=/favorites/map');
  }

  const user = await getSessionUser(token);
  if (!user) {
    redirect('/login?redirect=/favorites/map');
  }

  return (
    <BiteMapPage
      heading="My BiteMap"
      subheading="Explore your saved food spots on a map. Use your location to see what\'s nearby."
    />
  );
}
