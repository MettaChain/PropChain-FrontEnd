'use client';

import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from '@/components/ui/button';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  label?: string;
  icon?: LucideIcon;
  fallbackRoute?: string;
}

export function BackButton({
  label = 'Back',
  icon: Icon = ArrowLeft,
  fallbackRoute = '/',
  className,
  variant = 'ghost',
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackRoute);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label && <span>{label}</span>}
    </Button>
  );
}
