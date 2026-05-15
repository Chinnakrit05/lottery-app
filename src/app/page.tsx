'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sales');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      กำลังโหลด...
    </div>
  );
}
