
"use client";

import { useState, useEffect, useRef } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { OnboardingFlow } from '@/components/auth/onboarding-flow';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { TopNav } from '@/components/dashboard/top-nav';
import { AuditLogViewer } from '@/components/dashboard/audit-log-viewer';
import { AdminDocumentManager } from '@/components/dashboard/admin-document-manager';
import { StudentDocumentBrowser } from '@/components/dashboard/student-document-browser';
import { User as AppUser, UserRole } from '@/lib/types';
import { Loader2, Settings } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
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

  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authUser && !isAdminChecking && !isProfileLoading && db) {
      const role: UserRole = adminDoc ? 'admin' : 'student';
      const emailUsername = authUser.email ? authUser.email.split('@')[0] : (role === 'admin' ? 'Administrator' : 'Student');
      
      const userData: AppUser = {
        uid: authUser.uid,
        email: authUser.email || '',
        name: emailUsername,
        role: role,
        lastLogin: new Date().toISOString(),
        photoURL: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`,
        ...(profileDoc?.program ? { program: profileDoc.program } : {}),
      };
      
      setAppUser(userData);

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
        <Loader2 className="h-12 w-12 text-[#F2780D] animate-spin" />
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      {showOnboarding && <OnboardingFlow userId={appUser.uid} onComplete={handleOnboardingComplete} />}
      
      <aside className="hidden md:block w-72 shrink-0 h-screen sticky top-0 overflow-y-auto z-40">
        <SidebarNav 
          role={appUser.role} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          userName={appUser.name}
        />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav user={appUser} />

        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && appUser.role === 'student' && <StudentDocumentBrowser user={appUser} />}
            {activeTab === 'dashboard' && appUser.role === 'admin' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <h1 className="text-4xl font-bold tracking-tight text-[#0F172A]">Admin Overview</h1>
                <p className="text-[#64748B] text-lg">System analytics and registry monitoring coming soon.</p>
              </div>
            )}
            
            {activeTab === 'all-docs' && appUser.role === 'admin' && <AdminDocumentManager />}
            {activeTab === 'audit' && appUser.role === 'admin' && <AuditLogViewer />}

            {(activeTab === 'users' || activeTab === 'history' || activeTab === 'settings' || activeTab === 'downloads' || activeTab === 'curriculum' || activeTab === 'grades') && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                  <Settings className="h-12 w-12 text-[#CBD5E1]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[#0F172A]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
                  <p className="text-[#64748B] max-w-sm">This section is currently under development to match the new experience.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
