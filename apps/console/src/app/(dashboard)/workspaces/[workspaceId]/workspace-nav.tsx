"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface WorkspaceNavProps {
  workspaceId: string;
}

export function WorkspaceNav({ workspaceId }: WorkspaceNavProps) {
  const pathname = usePathname();

  const tabs = [
    { name: "Content", href: `/workspaces/${workspaceId}` },
    { name: "Playbooks", href: `/workspaces/${workspaceId}/playbooks` },
    { name: "Runs", href: `/workspaces/${workspaceId}/runs` },
    { name: "Secrets", href: `/workspaces/${workspaceId}/secrets` },
    { name: "Settings", href: `/workspaces/${workspaceId}/settings` },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive =
          tab.name === "Content"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
