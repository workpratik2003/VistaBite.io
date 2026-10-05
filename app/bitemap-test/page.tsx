import { redirect } from 'next/navigation';

/**
 * /bitemap-test — temporary development route.
 *
 * This route is deprecated and redirects to the canonical production route:
 * /favorites/map
 *
 * The development testing page has been integrated into the product as the
 * user-facing BiteMap experience at /favorites/map.
 */
export default function BitemapTestPage() {
  redirect('/favorites/map');
}
