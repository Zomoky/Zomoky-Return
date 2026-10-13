import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, navGroups, initials, displayName, counts } = useOwnerLayoutData();
  const grouped = navGroups.length ? navGroups : [{ label: null, items: navItems }];
  const [navOpen, setNavOpen] = useState(false);

  const nav = grouped.map((group, i) => (
    <div key={group.label ?? `group-${i}`} className="flex flex-col gap-1">
      {group.label && (
        <span className="px-3 pb-1 text-xs font-medium text-muted-foreground">{group.label}</span>
      )}
      {group.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setNavOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-(--transition-fast)',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            )
          }
        >
          <ApperIcon name={item.icon ?? 'Circle'} size={18} />
          <span className="flex-1">{item.label}</span>
          {counts[item.to] != null && (
            <span className="text-xs text-muted-foreground">{counts[item.to]}</span>
          )}
        </NavLink>
      ))}
    </div>
  ));

  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-(--spacing-sidebar) flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 px-2 font-heading text-xl font-semibold">
          <ApperIcon name={APP_CONFIG.icon} size={22} className="text-sidebar-primary" />
          {APP_CONFIG.name}
        </Link>
        <nav className="flex flex-1 flex-col gap-4">{nav}</nav>
        <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
          <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
          <div className="min-w-0 text-xs text-muted-foreground">Signed in as staff</div>
        </div>
      </aside>

      <header className="sticky top-0 z-(--z-sticky) flex h-(--spacing-header) items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg hover:bg-accent"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((o) => !o)}
        >
          <ApperIcon name="Menu" size={22} />
        </button>
        <Link to="/" className="font-heading text-lg font-semibold">{APP_CONFIG.name}</Link>
        <div className="ml-auto">
          <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
        </div>
      </header>
      {navOpen && (
        <nav className="flex flex-col gap-3 border-b border-border bg-sidebar p-3 lg:hidden">{nav}</nav>
      )}

      <main className="p-4 md:p-8 lg:pl-[calc(var(--spacing-sidebar)+2rem)]">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
