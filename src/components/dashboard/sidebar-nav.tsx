
"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  LayoutDashboard, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  User as UserIcon,
  UploadCloud,
  Clock
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface SidebarNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function SidebarNav({ role, activeTab, setActiveTab, onLogout }: SidebarNavProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'admin'] },
    { id: 'documents', label: 'My Documents', icon: FileText, roles: ['student'] },
    { id: 'all-docs', label: 'Manage Documents', icon: FileText, roles: ['admin'] },
    { id: 'upload', label: 'Upload New', icon: UploadCloud, roles: ['student'] },
    { id: 'audit', label: 'Security Audit', icon: ShieldCheck, roles: ['admin'] },
    { id: 'history', label: 'My Activity', icon: Clock, roles: ['student'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['student', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full bg-white border-r border-border p-4 space-y-2">
      <div className="mb-8 px-4 py-2">
        <h2 className="text-2xl font-headline font-bold text-primary">CICS Flow</h2>
      </div>
      
      <div className="flex-1 space-y-1">
        {filteredItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start text-sm font-medium h-11 px-4 transition-all duration-200",
              activeTab === item.id 
                ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" 
                : "text-muted-foreground hover:bg-accent"
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/5"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
