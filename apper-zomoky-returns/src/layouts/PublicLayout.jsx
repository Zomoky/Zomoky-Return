import { useLayoutEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_CONFIG } from '@/config/app.config';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  const { setTheme } = useTheme();
  const location = useLocation();

  useLayoutEffect(() => {
    setTheme('light');
  }, [setTheme]);

  if (location.pathname.startsWith('/checkout')) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 md:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold sm:text-xl">
          <ApperIcon name={APP_CONFIG.icon} size={21} className="shrink-0 text-primary" />
          <span className="truncate">{APP_CONFIG.name}</span>
        </Link>
        <nav className="ml-auto flex w-full items-center justify-end gap-1 text-sm sm:w-auto sm:gap-2">
          <Button variant="ghost" size="sm" className="min-h-10 px-2.5 sm:px-3" asChild>
            <Link to="/track">Track order</Link>
          </Button>
          <Button variant="ghost" size="sm" className="min-h-10 px-2.5 sm:px-3" asChild>
            <a href="mailto:support@zomoky.shop">Need help?</a>
          </Button>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted-foreground md:px-6">
        <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>Secure self-service returns, exchanges and cancellations.</span>
          <span>Questions? <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:support@zomoky.shop">support@zomoky.shop</a></span>
        </div>
      </footer>
    </div>
  );
}
