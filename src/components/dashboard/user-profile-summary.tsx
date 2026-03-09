
"use client";

import { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, GraduationCap, Clock } from 'lucide-react';

interface UserProfileSummaryProps {
  user: User;
}

export function UserProfileSummary({ user }: UserProfileSummaryProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className={`h-24 w-full ${user.role === 'admin' ? 'bg-secondary' : 'bg-primary'}`} />
      <CardContent className="relative pt-0 px-6 pb-6">
        <div className="flex flex-col items-center -mt-12 space-y-3">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="text-2xl font-headline bg-muted">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className="text-xl font-headline font-bold text-foreground">{user.name}</h3>
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'admin' ? 'secondary' : 'default'}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4 mt-4 text-sm text-muted-foreground pt-4 border-t border-muted">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <span className="truncate max-w-[180px]">{user.email}</span>
            </div>
            {user.role === 'student' && user.program && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-4 w-4 text-primary mt-1 shrink-0" />
                <span className="text-xs leading-relaxed">{user.program}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span>Verified Institution Account</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <span>Session: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
