'use client';

import { UpdateSection } from '@/components/update-section';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Github } from 'lucide-react';

export default function UpdatePage() {
  return (
    <div className="space-y-4 max-w-3xl animate-page-enter">
      <UpdateSection />

      <Card>
        <CardContent className="py-5 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground flex items-center gap-2">
            <Github className="h-4 w-4" />
            แหล่งเวอร์ชั่น
          </p>
          <p>
            แอปเช็คเวอร์ชั่นใหม่จาก{' '}
            <a
              href="https://github.com/Chinnakrit05/lottery-app/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              GitHub Releases <ExternalLink className="h-3 w-3" />
            </a>
            {' '}— ระบบจะเช็คอัพเดทอัตโนมัติทุก 30 นาที
          </p>
          <p className="text-xs">
            หากต้องการอัพเดททันที กดปุ่ม &ldquo;เช็คอัพเดท&rdquo; ด้านบน
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
