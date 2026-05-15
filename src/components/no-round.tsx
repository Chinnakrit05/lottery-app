'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function NoRound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">ยังไม่มีงวด</h3>
        <p className="text-sm text-muted-foreground">
          กดปุ่ม + มุมขวาบนเพื่อสร้างงวดใหม่ก่อนเริ่มใช้งาน
        </p>
      </CardContent>
    </Card>
  );
}
