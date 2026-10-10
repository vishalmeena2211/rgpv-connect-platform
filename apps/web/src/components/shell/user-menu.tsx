'use client';

import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Settings, Shield, Upload, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOutAction } from '@/features/auth/actions';
import { initials } from '@/lib/utils';

const itemClass =
  'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] outline-none data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground';

export function UserMenu({
  name,
  avatarUrl,
  userId,
  isAdmin,
}: {
  name: string;
  avatarUrl: string | null;
  userId: string;
  isAdmin: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="ml-1 rounded-full focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-lg border bg-card p-1.5 shadow-raised data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate font-display text-[13px] font-bold">{name}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={`/u/${userId}`}>
              <User />
              My profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/uploads">
              <Upload />
              My uploads
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenu.Item>
          {isAdmin ? (
            <DropdownMenu.Item asChild className={itemClass}>
              <Link href="/admin">
                <Shield />
                Admin
              </Link>
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <form action={signOutAction}>
            <DropdownMenu.Item asChild className={itemClass}>
              <button type="submit" className="w-full">
                <LogOut />
                Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
