import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  number: string;
  isReverse?: boolean | number;
  highlight?: boolean;
  className?: string;
}

export function TicketNumber({ number, isReverse, highlight, className }: Props) {
  const rev = Boolean(isReverse);
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        className={cn(
          'font-mono text-base font-semibold tracking-wider',
          highlight && 'text-amber-600 dark:text-amber-300',
        )}
      >
        {number}
      </span>
      {rev && (
        <Badge variant="outline" className="border-purple-500/40 text-purple-700 dark:text-purple-300 text-[10px]">
          🔄 กลับ
        </Badge>
      )}
    </span>
  );
}
