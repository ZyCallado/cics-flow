
"use client"

import { Input } from '@/components/ui/input';
import { Search, Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';

interface TopNavProps {
  user: User;
}

export function TopNav({ user }: TopNavProps) {
  const initials = user.name.split(/[ ._]/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="h-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <Input 
          placeholder="Search resources..." 
          className="bg-[#F8FAFC] border-none rounded-xl pl-12 h-11 focus-visible:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-[#F1F5F9]">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#0F172A] leading-none">{user.name}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="bg-orange-50 text-primary font-bold text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
