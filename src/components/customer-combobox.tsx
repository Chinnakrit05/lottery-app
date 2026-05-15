'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dbClient } from '@/lib/db-client';
import type { Customer } from '@/types/database';
import { toast } from 'sonner';

interface Props {
  value: Customer | null;
  onChange: (v: Customer | null) => void;
  className?: string;
}

export function CustomerCombobox({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const load = async () => {
    const list = await dbClient.customers.list();
    setCustomers(list);
  };
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone?.includes(query),
  );

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;
    try {
      const created = await dbClient.customers.create({ name });
      setCustomers([...customers, created]);
      onChange(created);
      setQuery('');
      setOpen(false);
      toast.success('สร้างลูกค้าใหม่: ' + name);
    } catch (e: any) {
      toast.error('สร้างไม่สำเร็จ: ' + e.message);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex">
        <Button
          variant="outline"
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 justify-between font-normal"
        >
          {value ? <span>👤 {value.name}{value.phone ? ` · ${value.phone}` : ''}</span> : <span className="text-muted-foreground">เลือก/สร้างลูกค้า…</span>}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            title="ล้าง"
            className="ml-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          <Input
            placeholder="ค้นหาด้วยชื่อ/เบอร์ หรือ พิมพ์ชื่อใหม่"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && filtered.length === 0) {
                e.preventDefault();
                handleCreate();
              }
            }}
            autoFocus
          />
          <div className="mt-2 max-h-56 overflow-y-auto">
            {filtered.length === 0 && query.trim().length > 0 && (
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                สร้างลูกค้าใหม่: <span className="font-medium">{query}</span>
              </button>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span>
                  👤 {c.name}
                  {c.phone && <span className="ml-2 text-muted-foreground">{c.phone}</span>}
                </span>
                {value?.id === c.id && <Check className="h-4 w-4" />}
              </button>
            ))}
            {filtered.length === 0 && query.trim().length === 0 && customers.length === 0 && (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                ยังไม่มีลูกค้า — พิมพ์ชื่อแล้วกด Enter เพื่อสร้าง
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
