'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSeed() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to seed');
      }
    } catch (err) {
      alert('Failed to seed agents');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={isLoading}
      className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {isLoading ? 'Seeding...' : 'Seed Agents'}
    </button>
  );
}
