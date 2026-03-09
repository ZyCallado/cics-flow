
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, ShieldAlert, GraduationCap, Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin: (role: 'student' | 'admin', email: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStudentLogin = () => {
    // In a real app, this would trigger Google OAuth
    // Mocking for now - restrictive email domain logic
    const mockEmail = "student@neu.edu.ph";
    if (!mockEmail.endsWith("@neu.edu.ph")) {
      setError("Access restricted to @neu.edu.ph emails.");
      return;
    }
    onLogin('student', mockEmail);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@cics.edu' && adminPassword === 'password') {
      onLogin('admin', adminEmail);
    } else {
      setError('Invalid administrator credentials.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">CICS Flow</h1>
        <p className="text-muted-foreground font-body">Connect. Manage. Secure.</p>
      </div>

      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
          <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:text-primary">
            Student
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:text-secondary">
            Administrator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <GraduationCap className="text-primary w-6 h-6" />
              </div>
              <CardTitle className="font-headline text-2xl">Student Login</CardTitle>
              <CardDescription>
                Use your official NEU Google account to access your documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStudentLogin}
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
              >
                <LogIn className="mr-2 h-5 w-5" /> Sign in with Google
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Strictly restricted to <span className="font-semibold">@neu.edu.ph</span> emails.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert className="text-secondary w-6 h-6" />
              </div>
              <CardTitle className="font-headline text-2xl">Admin Portal</CardTitle>
              <CardDescription>
                Authorized personnel only. Secure credentials required.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAdminLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@cics.edu" 
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required 
                    className="focus:ring-secondary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required 
                    className="focus:ring-secondary/20"
                  />
                </div>
                {error && <p className="text-sm text-destructive font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> {error}</p>}
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit"
                  className="w-full h-12 text-lg font-medium bg-secondary hover:bg-secondary/90 transition-all hover:scale-[1.02]"
                >
                  Authenticate
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
