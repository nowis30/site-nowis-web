'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ContactPrefillLinkProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function ContactPrefillLink({
  href = '/contact',
  className,
  children,
  onClick,
}: ContactPrefillLinkProps) {
  const { user } = useAuth();
  const name = user?.name;
  const email = user?.email;

  const resolvedHref = useMemo(() => {
    const [pathname, hash = ''] = href.split('#');
    const [basePath, search = ''] = pathname.split('?');
    const params = new URLSearchParams(search);

    if (name && !params.has('name')) {
      params.set('name', name);
    }

    if (email && !params.has('email')) {
      params.set('email', email);
    }

    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
  }, [href, email, name]);

  return (
    <Link href={resolvedHref} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
