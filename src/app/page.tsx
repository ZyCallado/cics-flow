
"use client";

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { AuditLogViewer } from '@/components/dashboard/audit-log-viewer';
import { UserProfileSummary } from '@/components/dashboard/user-profile-summary';
import { User as AppUser, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, TrendingUp, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function Home() {
  const { user: authUser, isUserLoading } = useUser();
  const { auth } = useAuth();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is an admin by looking at the roles_admin collection
  const adminRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'roles_admin', authUser.uid);
  }, [db, authUser]);

  const { data: adminDoc, isLoading: isAdminChecking } = useDoc(adminRef);

  // Derive the application user profile
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authUser && !isAdminChecking && db) {
      const role: UserRole = adminDoc ? 'admin' : 'student';
      const userData: AppUser = {
        uid: authUser.uid,
        email: authUser.email || '',
        name: authUser.displayName || (role === 'admin' ? 'Administrator' : 'Student'),
        role: role,
        lastLogin: new Date().toISOString(),
        photoURL: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`
      };
      setAppUser(userData);

      // Persist user profile to Firestore
      const userRef = doc(db, 'users', authUser.uid);
      setDocumentNonBlocking(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } else if (!authUser && !isUserLoading) {
      setAppUser(null);
    }
  }, [authUser, adminDoc, isAdminChecking, db, isUserLoading]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const handleMakeAdmin = () => {
    if (!authUser || !db) return;
    const adminDocRef = doc(db, 'roles_admin', authUser.uid);
    setDocumentNonBlocking(adminDocRef, {
      uid: authUser.uid,
      email: authUser.email,
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  if (isUserLoading || (authUser && isAdminChecking)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!appUser) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        <LoginForm />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:block w-72 shrink-0 h-screen sticky top-0 overflow-y-auto z-40">
        <SidebarNav 
          role={appUser.role} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-4xl font-headline font-bold mb-2">Welcome back, {appUser.name.split(' ')[0]}</h1>
                  <p className="text-muted-foreground">Manage your department documents and security settings.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                        <FileText className="text-primary w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-medium">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-headline font-bold">12</div>
                      <p className="text-xs text-muted-foreground">+2 since last week</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="h-10 w-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-2">
                        <Clock className="text-secondary w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-medium">Active Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-headline font-bold">24h</div>
                      <p className="text-xs text-muted-foreground">Uptime monitoring active</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                        <TrendingUp className="text-orange-600 w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-medium">Usage Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Optimal</Badge>
                      <p className="text-xs text-muted-foreground mt-2">Systems functioning normally</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md bg-white">
                  <CardHeader>
                    <CardTitle className="font-headline">Recent System Announcements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-lg bg-accent/50 border border-border">
                      <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold">Security Update</h4>
                        <p className="text-sm text-muted-foreground">We've enhanced our Google OAuth filters. Only @neu.edu.ph accounts can authenticate.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <UserProfileSummary user={appUser} />
                {appUser.role === 'admin' && (
                  <Card className="bg-primary text-white border-none shadow-xl overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setActiveTab('audit')}>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={120} />
                    </div>
                    <CardHeader>
                      <CardTitle className="font-headline flex items-center gap-2">
                        Security Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-white/80">3 new unusual login patterns detected. Run AI analysis for details.</p>
                      <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-wider">
                        Explore Audit Logs &rarr;
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && appUser.role === 'admin' && (
            <AuditLogViewer />
          )}

          {activeTab !== 'dashboard' && activeTab !== 'audit' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="p-6 bg-white rounded-full shadow-lg">
                <FileText className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <h2 className="text-2xl font-headline font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
              <p className="text-muted-foreground max-w-sm">This feature is part of the next development sprint. Our team is currently building this workspace.</p>
            </div>
          )}
        </div>

        {/* Prototyping Utility: Promote to Admin */}
        {authUser && appUser.role !== 'admin' && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white shadow-xl border-primary/20 hover:border-primary transition-colors"
              onClick={handleMakeAdmin}
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
              Promote to Admin (Dev Mode)
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
