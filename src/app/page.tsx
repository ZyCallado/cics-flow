
"use client";

import { useState, useEffect, useRef } from 'react';
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
import { FileText, Clock, TrendingUp, AlertCircle, Loader2, Search, ExternalLink, ShieldCheck, GraduationCap, Settings } from 'lucide-react';
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
  const hasSyncedProfile = useRef(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
  }, [db, authUser]);
  const { data: profileDoc, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const adminRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'roles_admin', authUser.uid);
  }, [db, authUser]);
  const { data: adminDoc, isLoading: isAdminChecking } = useDoc(adminRef);

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
        ...(profileDoc?.program ? { program: profileDoc.program } : {}),
      };
      
      setAppUser(userData);

      // Only show onboarding for students who haven't selected a program
      if (role === 'student' && !profileDoc?.program) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }

      if (!hasSyncedProfile.current) {
        hasSyncedProfile.current = true;
        const syncData: any = {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          lastLogin: userData.lastLogin,
          photoURL: userData.photoURL,
          updatedAt: serverTimestamp(),
        };
        if (userData.program) syncData.program = userData.program;

        setDocumentNonBlocking(doc(db, 'users', authUser.uid), syncData, { merge: true });
      }

    } else if (!authUser && !isUserLoading) {
      setAppUser(null);
      setShowOnboarding(false);
      hasSyncedProfile.current = false;
    }
  }, [authUser, adminDoc, profileDoc, isAdminChecking, isProfileLoading, db, isUserLoading]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setActiveTab('dashboard');
    setShowOnboarding(false);
    hasSyncedProfile.current = false;
  };

  const handleOnboardingComplete = (program: string) => {
    if (appUser) {
      setAppUser({ ...appUser, program });
    }
    setShowOnboarding(false);
  };

  if (isUserLoading || (authUser && (isAdminChecking || isProfileLoading))) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!appUser) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <LoginForm />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-body">
      {showOnboarding && <OnboardingFlow userId={appUser.uid} onComplete={handleOnboardingComplete} />}
      
      <aside className="hidden md:block w-72 shrink-0 h-screen sticky top-0 overflow-y-auto z-40">
        <SidebarNav 
          role={appUser.role} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
        />
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-[#0F172A]">Welcome back, {appUser.name.split(' ')[0]}!</h1>
                  <p className="text-[#64748B] text-lg mt-2">
                    {appUser.role === 'admin' 
                      ? "Here's what's happening with the document registry today." 
                      : `Access your ${appUser.program || 'student'} resources.`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="border-none shadow-sm bg-white rounded-2xl p-6">
                    <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="text-[#F2780D] w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Total Resources</p>
                    <div className="text-3xl font-bold text-[#0F172A] mt-1">{recentDocs?.length || 0}</div>
                  </Card>
                  <Card className="border-none shadow-sm bg-white rounded-2xl p-6">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <ShieldCheck className="text-blue-600 w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Account Status</p>
                    <div className="text-2xl font-bold text-[#0F172A] mt-1">{appUser.role.toUpperCase()}</div>
                  </Card>
                  <Card className="border-none shadow-sm bg-white rounded-2xl p-6">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <Clock className="text-green-600 w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Session Date</p>
                    <div className="text-2xl font-bold text-[#0F172A] mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </Card>
                </div>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-[#F1F5F9]">
                    <CardTitle className="text-xl font-bold text-[#0F172A]">Recently Modified</CardTitle>
                    <Button variant="ghost" className="text-primary font-bold hover:bg-orange-50" onClick={() => setActiveTab(appUser.role === 'admin' ? 'all-docs' : 'documents')}>
                      See all documents
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {recentDocs && recentDocs.length > 0 ? (
                      <div className="divide-y divide-[#F1F5F9]">
                        {recentDocs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between px-8 py-4 hover:bg-[#F8FAFC] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-red-50 text-red-500 rounded-lg">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0F172A]">{doc.name}</p>
                                <p className="text-xs text-[#64748B]">{doc.category}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-primary rounded-lg" asChild>
                              <a href={doc.storagePath} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-5 w-5" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#64748B] text-center py-12 italic">No recent activity found.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <UserProfileSummary user={appUser} />
                <Card className="bg-[#0F172A] text-white border-none shadow-xl rounded-2xl p-8 relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck size={160} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <Badge className="bg-primary hover:bg-primary border-none text-white px-3 py-1 rounded-lg">System Status</Badge>
                    <h3 className="text-2xl font-bold leading-tight">Security & Audit logs are live</h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">
                      All document transactions and administrative access attempts are recorded for institutional security monitoring.
                    </p>
                    {appUser.role === 'admin' && (
                      <Button variant="link" className="p-0 text-primary font-bold hover:text-primary/80 no-underline group-hover:underline" onClick={() => setActiveTab('audit')}>
                        Open Audit Dashboard →
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'audit' && appUser.role === 'admin' && <AuditLogViewer />}
          {activeTab === 'all-docs' && appUser.role === 'admin' && <AdminDocumentManager />}
          {activeTab === 'documents' && <StudentDocumentBrowser />}

          {(activeTab === 'users' || activeTab === 'history' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                <Settings className="h-12 w-12 text-[#CBD5E1]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#0F172A]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
                <p className="text-[#64748B] max-w-sm">This module is currently undergoing system maintenance. Check back later.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
