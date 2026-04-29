'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Building2, 
  Briefcase, 
  Heart, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    id: 'properties',
    name: 'Properties',
    href: '/properties',
    icon: Building2,
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    href: '/dashboard',
    icon: Briefcase,
  },
  {
    id: 'watchlist',
    name: 'Watchlist',
    href: '/watchlist',
    icon: Heart,
  },
  {
    id: 'profile',
    name: 'Profile',
    href: '/dashboard',
    icon: User,
  },
];

export const MobileBottomNavigation: React.FC = () => {
  const pathname = usePathname();

  // Only show on mobile screens
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.id === 'portfolio' && pathname.startsWith('/dashboard')) ||
                           (item.id === 'profile' && pathname.startsWith('/dashboard'));
            
            return (
              <Link
                key={item.id}
                href={item.href}
                data-tour={item.id === 'portfolio' ? 'portfolio-link' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <item.icon 
                  className={cn(
                    'w-5 h-5 mb-1 transition-transform duration-200',
                    isActive && 'scale-110'
                  )} 
                />
                <span className="text-xs font-medium truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
