import Link from 'next/link';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { ErrorState } from '@/ui/ErrorState';
import { buttonClasses } from '@/ui/Button';

export default function NotFound() {
  return (
    <>
      <SiteHeader showBack />
      <main id="main" className="h-screen-safe flex items-center justify-center">
        <div className="container-reading px-4">
          <ErrorState
            kind="not_found"
            actions={
              <Link href="/" className={buttonClasses('primary', 'md')}>
                回首页
              </Link>
            }
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
