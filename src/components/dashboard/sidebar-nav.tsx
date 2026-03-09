
"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  LogOut, 
  Settings
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function SidebarNav({ role, activeTab, setActiveTab, onLogout }: SidebarNavProps) {
  const { user } = useUser();
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'admin'] },
    { id: 'all-docs', label: 'Documents', icon: FileText, roles: ['admin'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'audit', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#F1F5F9] p-4 pt-8 space-y-8 animate-in slide-in-from-left duration-700">
      {/* Logo Section */}
      <div className="px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] leading-none">CICS Portal</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mt-1">Admin Panel</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Section */}
      <div className="flex-1 space-y-1">
        {filteredItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start text-sm font-bold h-12 px-4 rounded-xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-orange-50 text-primary hover:bg-orange-50 hover:text-primary relative" 
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className={cn(
              "mr-3 h-5 w-5 transition-colors",
              activeTab === item.id ? "text-primary" : "text-[#94A3B8] group-hover:text-[#0F172A]"
            )} />
            {item.label}
            {activeTab === item.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-l-full" />
            )}
          </Button>
        ))}
      </div>

      {/* User Footer Section */}
      <div className="pt-6 border-t border-[#F1F5F9] space-y-4">
        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar className="h-10 w-10 border-2 border-orange-100 ring-2 ring-white">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-orange-50 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F172A] truncate leading-none">{user?.displayName || 'John Doe'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mt-1">Admin Access</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
