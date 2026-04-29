'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';

import { trackPhoneClick } from '@/lib/tracking/google';

type TrackedPhoneLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function TrackedPhoneLink({ href, onClick, ...props }: TrackedPhoneLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackPhoneClick(href);
    onClick?.(event);
  }

  return <a {...props} href={href} onClick={handleClick} />;
}