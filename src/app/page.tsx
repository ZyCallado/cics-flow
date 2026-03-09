
"use client";

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { OnboardingFlow } from '@/components/auth/onboarding-flow';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { AuditLogViewer } from '@/components/dashboard/audit-log-viewer';
import { AdminDocumentManager } from '@/components/dashboard/admin-document-manager';
import { StudentDocumentBrowser } from '@/components/dashboard/student-document-browser';
import { UserProfileSummary } from '@/components/dashboard/user-profile-summary';
import { User as AppUser, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, TrendingUp, AlertCircle, Loader2, Search } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, serverTimestamp, collection, query, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function Home() {
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch application user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
  }, [db, authUser]);
  const { data: profileDoc, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Check if user is an admin
  const adminRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'roles_admin', authUser.uid);
  }, [db, authUser]);
  const { data: adminDoc, isLoading: isAdminChecking } = useDoc(adminRef);

  // Fetch some stats for the dashboard
  const docsQuery = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return query(collection(db, 'documents'), limit(5));
  }, [db, authUser]);
  const { data: recentDocs } = useCollection(docsQuery);

  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authUser && !isAdminChecking && !isProfileLoading && db) {
      const role: UserRole = adminDoc ? 'admin' : 'student';
      
      const userData: AppUser = {
        uid: authUser.uid,
        email: authUser.email || '',
        name: authUser.displayName || (role === 'admin' ? 'Administrator' : 'Student'),
        role: role,
        lastLogin: new Date().toISOString(),
        photoURL: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`,
        program: profileDoc?.program || undefined
      };
      setAppUser(userData);

      // Trigger onboarding for students without a program
      if (role === 'student' && !profileDoc?.program) {
        setShowOnboarding(true);
      }

      // Sync last login
      setDocumentNonBlocking(doc(db, 'users', authUser.uid), {
        ...userData,
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } else if (!authUser && !isUserLoading) {
      setAppUser(null);
    }
  }, [authUser, adminDoc, profileDoc, isAdminChecking, isProfileLoading, db, isUserLoading]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
    setShowOnboarding(false);
  };

  const handleOnboardingComplete = (program: string) => {
    if (appUser) {
      setAppUser({ ...appUser, program });
    }
    setShowOnboarding(false);
  };

  if (isUserLoading || (authUser && (isAdminChecking || isProfileLoading))) {
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
      {showOnboarding && <OnboardingFlow userId={appUser.uid} onComplete={handleOnboardingComplete} />}
      
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
                  <h1 className="text-4xl font-headline font-bold mb-2">Welcome, {appUser.name.split(' ')[0]}</h1>
                  <p className="text-muted-foreground">
                    {appUser.role === 'admin' 
                      ? "Administrative Control Center" 
                      : `Access your ${appUser.program?.split('(')[1]?.replace(')', '') || 'student'} resources.`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                        <FileText className="text-primary w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-medium">Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-headline font-bold">{recentDocs?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Available docs</p>
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
                      <div className="text-2xl font-headline font-bold">Live</div>
                      <p className="text-xs text-muted-foreground">Security active</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                        <TrendingUp className="text-orange-600 w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-medium">System</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Stable</Badge>
                      <p className="text-xs text-muted-foreground mt-2">All units online</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md bg-white overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline">Recently Added Documents</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab(appUser.role === 'admin' ? 'all-docs' : 'documents')}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {recentDocs && recentDocs.length > 0 ? (
                      <div className="space-y-3">
                        {recentDocs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.category}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.storagePath} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4 italic">No documents available yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <UserProfileSummary user={appUser} />
                <Card className="bg-primary text-white border-none shadow-xl overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setActiveTab(appUser.role === 'admin' ? 'audit' : 'documents')}>
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    {appUser.role === 'admin' ? <ShieldCheck size={120} /> : <Search size={120} />}
                  </div>
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      {appUser.role === 'admin' ? "Security Status" : "Quick Search"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/80">
                      {appUser.role === 'admin' 
                        ? "Audit logs and system access reports are ready for analysis." 
                        : "Looking for specific forms or handbooks? Browse our digital library."
                      }
                    </p>
                    <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-wider">
                      {appUser.role === 'admin' ? "Audit Dashboard →" : "Browse Library →"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'audit' && appUser.role === 'admin' && (
            <AuditLogViewer />
          )}

          {activeTab === 'all-docs' && appUser.role === 'admin' && (
            <AdminDocumentManager />
          )}

          {activeTab === 'documents' && (
            <StudentDocumentBrowser />
          )}

          {(activeTab === 'upload' || activeTab === 'history' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="p-6 bg-white rounded-full shadow-lg">
                <FileText className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <h2 className="text-2xl font-headline font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} Module</h2>
              <p className="text-muted-foreground max-w-sm">This feature is part of the next development sprint. Our team is currently building this workspace.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
