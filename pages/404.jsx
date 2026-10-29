import React from 'react';
import Link from 'next/link';
export default function NotFound() { return <main className="empty-state"><h1>PAGE NOT FOUND.</h1><p>This page may have moved.</p><Link className="store-button" href="/home">Back to the collection ↗</Link></main>; }
