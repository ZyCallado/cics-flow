
"use client"

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home,
  DownloadCloud,
  GraduationCap,
  Library,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface SidebarNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

export function SidebarNav({ role, activeTab, setActiveTab, onLogout, userName }: SidebarNavProps) {
  const studentItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'downloads', label: 'My Downloads', icon: DownloadCloud },
  ];

  const adminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all-docs', label: 'Documents', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Reports', icon: BarChart3 },
  ];

  const shortcuts = [
    { id: 'library', label: 'Library Catalog', icon: Library },
    { id: 'support', label: 'IT Support', icon: LifeBuoy },
  ];

  const menuItems = role === 'admin' ? adminItems : studentItems;

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#F1F5F9] w-full">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-[#F2780D] h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-[#0F172A] tracking-tight">CICS Portal</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm font-semibold h-11 px-4 rounded-xl transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-[#F2780D] text-white hover:bg-[#F2780D] hover:text-white" 
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5",
                activeTab === item.id ? "text-white" : "text-[#94A3B8] group-hover:text-[#0F172A]"
              )} />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Shortcuts Section */}
        {role === 'student' && (
          <div className="space-y-3">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Shortcuts</p>
            <div className="space-y-1">
              {shortcuts.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-sm font-semibold h-11 px-4 rounded-xl text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] group"
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="mr-3 h-5 w-5 text-[#94A3B8] group-hover:text-[#0F172A]" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#F1F5F9]">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sm font-semibold h-11 px-4 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 group"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
