import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return <h1 className={cn('text-4xl font-bold', className)}>{children}</h1>;
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn('text-3xl font-semibold', className)}>{children}</h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn('text-2xl font-semibold', className)}>{children}</h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return <h4 className={cn('text-xl font-semibold', className)}>{children}</h4>;
}

export function P({ children, className }: TypographyProps) {
  return <p className={cn('text-lg', className)}>{children}</p>;
}

export function Small({ children, className }: TypographyProps) {
  return <p className={cn('text-sm', className)}>{children}</p>;
}

export function Lead({ children, className }: TypographyProps) {
  return <p className={cn('text-xl', className)}>{children}</p>;
}
