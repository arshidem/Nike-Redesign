import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import '../nike/src/index.css';
import '../nike/src/css/home.css';
import '../nike/src/css/navbar.css';
import '../nike/src/css/shopByIcons.css';
import '../nike/src/css/storefront.css';
import '../nike/src/css/design-system.css';
import '../nike/src/css/legal.css';
const ClientRoot = dynamic(() => import('../nike/src/lib/ClientRoot'), { ssr: false, loading: () => <main className="empty-state" aria-live="polite">Loading the store…</main> });
export default function App({ Component, pageProps }) {
  return <><Head><title>Nike — Independent Storefront | Triode Studio</title><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="description" content="An independent Nike-inspired storefront by Triode Studio. Explore footwear, collections, and your next everyday icon." /><link rel="icon" href="/assets/logo/nikeLogoRounded.png" /><link rel="manifest" href="/manifest.webmanifest" /></Head><ClientRoot Component={Component} pageProps={pageProps} /></>;
}
