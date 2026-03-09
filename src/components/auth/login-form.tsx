"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ShieldCheck, Mail, Lock, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict domain validation
    if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Registration and login are strictly restricted to @neu.edu.ph email addresses.",
      });
      return;
    }

    setIsLoading(true);
    
    const callback = (error: any) => {
      setIsLoading(false);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      // Handle specific Firebase Auth error codes
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please verify your credentials.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try signing in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }

      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Authentication Failed",
        description: errorMessage,
      });
    };

    if (isSignUp) {
      initiateEmailSignUp(auth, email, password, callback);
    } else {
      initiateEmailSignIn(auth, email, password, callback);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">CICS Flow</h1>
        <p className="text-muted-foreground font-body">Access your unified document management portal.</p>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {isSignUp ? <UserPlus className="text-primary w-6 h-6" /> : <ShieldCheck className="text-primary w-6 h-6" />}
          </div>
          <CardTitle className="font-headline text-2xl">{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Join CICS Flow to manage your documents.' : 'Enter your credentials to access your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@neu.edu.ph" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
                className="focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
                className="focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-100 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Restriction Active: Only <strong>@neu.edu.ph</strong> accounts are authorized for access.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />}
                  {isSignUp ? 'Register' : 'Authenticate'}
                </>
              )}
            </Button>
            
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-primary/80 hover:bg-primary/5"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}