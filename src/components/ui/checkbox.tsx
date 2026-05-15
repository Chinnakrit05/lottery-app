'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, ...props }, ref) => {
  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
        {...props}
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
