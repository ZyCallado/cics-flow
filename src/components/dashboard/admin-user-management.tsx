
"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { User as AppUser } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  UserX, 
  UserCheck, 
  ShieldAlert,
  GraduationCap,
  Mail,
  History
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export function AdminUserManagement() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), orderBy('lastLogin', 'desc')) : null, [db]);
  const { data: users, isLoading } = useCollection<AppUser>(usersQuery);

  const filteredUsers = users?.filter(u => u.role === 'student' && (
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.program?.toLowerCase().includes(searchTerm.toLowerCase()))
  )) || [];

  const handleToggleBlock = (user: AppUser) => {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    const newStatus = !user.isBlocked;
    
    updateDocumentNonBlocking(userRef, {
      isBlocked: newStatus,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: newStatus ? "Account Blocked" : "Account Unblocked",
      description: `${user.name} has been ${newStatus ? 'restricted from' : 'granted'} system access.`,
      variant: newStatus ? "destructive" : "default"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">User Management</h1>
        <p className="text-[#64748B] text-sm mt-1">Monitor registered students and manage account access permissions.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
        <Input 
          placeholder="Search students by name, email, or program..." 
          className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm text-lg focus-visible:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="hover:bg-transparent border-b border-[#F1F5F9]">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] py-4 pl-6">Student</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Program</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Last Active</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center text-muted-foreground">No students found.</TableCell></TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.uid} className="hover:bg-[#F8FAFC] border-b border-[#F1F5F9] transition-colors group">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-orange-50 text-primary font-bold text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{user.name}</p>
                        <p className="text-[10px] text-[#94A3B8] flex items-center gap-1 font-medium">
                          <Mail className="h-2 w-2" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#94A3B8]" />
                      <span className="text-xs font-semibold text-[#64748B] max-w-[200px] truncate">
                        {user.program || 'Not Enrolled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#64748B] text-xs">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#CBD5E1]" />
                      {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge className="bg-red-50 text-red-600 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Blocked
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl transition-all ${
                        user.isBlocked 
                          ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                          : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                      }`}
                      onClick={() => handleToggleBlock(user)}
                    >
                      {user.isBlocked ? (
                        <><UserCheck className="mr-2 h-3 w-3" /> Unblock</>
                      ) : (
                        <><UserX className="mr-2 h-3 w-3" /> Block</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
