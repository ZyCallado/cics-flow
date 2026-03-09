
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
  Search,
  Clock,
  BookOpen
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
    { id: 'documents', label: 'Library', icon: BookOpen, roles: ['student'] },
    { id: 'all-docs', label: 'Manage Registry', icon: FileText, roles: ['admin'] },
    { id: 'history', label: 'My Activity', icon: Clock, roles: ['student'] },
    { id: 'audit', label: 'Security Audit', icon: ShieldCheck, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['student', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full bg-white border-r border-border p-4 space-y-2 shadow-sm">
      <div className="mb-8 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="text-white h-5 w-5" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-foreground">CICS Flow</h2>
        </div>
      </div>
      
      <div className="flex-1 space-y-1">
        {filteredItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start text-sm font-medium h-11 px-4 transition-all duration-200",
              activeTab === item.id 
                ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-accent"
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="pt-4 border-t border-border mt-auto">
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
