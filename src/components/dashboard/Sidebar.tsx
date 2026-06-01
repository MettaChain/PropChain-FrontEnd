'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Wallet,
  FileText,
  Settings,
  HelpCircle,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/dashboard?tab=analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard?tab=wallet', label: 'Wallet', icon: Wallet },
  { href: '/tax-report', label: 'Reports', icon: FileText },
];

const bottomItems = [
  { href: '/dashboard?tab=settings', label: 'Settings', icon: Settings },
  { href: '/dashboard?tab=help', label: 'Help & Support', icon: HelpCircle },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        isCollapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span>{label}</span>
          {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
        </>
      )}
    </Link>
  );
}

function SidebarContent({
  isCollapsed,
  onClose,
  onToggleCollapse,
  isMobileDrawer,
}: {
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {(!isCollapsed || isMobileDrawer) && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">PC</span>
            </div>
            <span className="font-bold text-base">PropChain</span>
          </div>
        )}
        {isMobileDrawer ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(isCollapsed && 'mx-auto')}
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', isCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Dashboard navigation">
        {!isCollapsed && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Main Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={pathname === item.href.split('?')[0] && item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href.split('?')[0]}
            isCollapsed={isCollapsed && !isMobileDrawer}
            onClick={isMobileDrawer ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={false}
            isCollapsed={isCollapsed && !isMobileDrawer}
            onClick={isMobileDrawer ? onClose : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card h-screen sticky top-0 shrink-0 transition-all duration-300',
          isCollapsed ? 'w-14' : 'w-64'
        )}
        aria-label="Sidebar"
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 w-72 h-screen bg-card border-r border-border z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar"
        aria-hidden={!isOpen}
      >
        <SidebarContent
          isCollapsed={false}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
          isMobileDrawer
        />
      </aside>
    </>
  );
}
