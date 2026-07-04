import { ReactNode } from 'react';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-sm">
          {actionLabel}
        </Button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
