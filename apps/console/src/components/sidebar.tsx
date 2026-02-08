'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Folder, Monitor, FileText, Zap, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: { id: string; email: string };
}

const navigation = [
  { name: 'Workspaces', href: '/workspaces', icon: Folder },
  { name: 'Agents', href: '/agents', icon: Monitor },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Activity', href: '/activity', icon: Zap },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-72 border-r border-border/60 bg-card/90 backdrop-blur flex flex-col bg-grid">
      <div className="p-5 border-b border-border/60">
        <Link href="/workspaces" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/20 ring-glow flex items-center justify-center text-primary font-bold tracking-[0.2em]">
            C
          </div>
          <div className="leading-tight">
            <span className="block text-sm tracking-[0.3em] text-muted-foreground uppercase font-mono">
              CASCADE
            </span>
            <span className="text-lg font-semibold text-glow">Command</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all border border-transparent',
                isActive
                  ? 'bg-primary/15 text-primary ring-glow border-primary/30'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-border/60'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/60">
        <div className="glass rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-sm font-semibold text-primary">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
              Operator
            </p>
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-muted/60 transition-colors"
            title="Sign out"
            aria-label="Sign out of account"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
