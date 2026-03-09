"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Document as AppDocument, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Loader2,
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All Resources', 'Lecture Notes', 'Research Papers', 'Exam Prep', 'Reference Materials'];
const STABLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

interface StudentDocumentBrowserProps {
  user: User;
}

export function StudentDocumentBrowser({ user }: StudentDocumentBrowserProps) {
  const db = useFirestore();
  const [selectedCategory, setSelectedCategory] = useState('All Resources');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
  }, [db]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => {
    if (selectedCategory === 'All Resources') return true;
    return doc.category === selectedCategory;
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-[#0F172A]">Student Dashboard</h2>
        <p className="text-[#64748B]">
          Welcome back, {user.name.split('.')[0]}. You have {filteredDocs.length} resources available in {user.program || 'your program'}.
        </p>
      </div>

      {/* Categories Tabs */}
      <Tabs defaultValue="All Resources" onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="bg-transparent border-none h-auto p-0 gap-8">
          {CATEGORIES.map(cat => (
            <TabsTrigger 
              key={cat} 
              value={cat}
              className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-[#F2780D] data-[state=active]:text-[#F2780D] data-[state=active]:shadow-none rounded-none text-[#64748B] font-semibold transition-all h-auto"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Documents Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#0F172A]">Recent Documents</h3>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-[#F1F5F9]">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-md", viewMode === 'grid' ? "bg-[#F8FAFC] text-[#F2780D]" : "text-[#94A3B8]")}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-md", viewMode === 'list' ? "bg-[#F8FAFC] text-[#F2780D]" : "text-[#94A3B8]")}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#64748B]">
          <Loader2 className="h-10 w-10 animate-spin text-[#F2780D] mb-4" />
          <p className="font-semibold">Syncing library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white/50 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <FileText className="h-8 w-8 text-[#CBD5E1]" />
            </div>
            <div>
              <p className="font-bold text-[#0F172A]">Missing a resource?</p>
              <p className="text-xs text-[#94A3B8] mt-1">Request document upload from faculty.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-[#F2780D]" />
                  </div>
                  <Badge variant="secondary" className="bg-[#F8FAFC] text-[#64748B] border-none text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    PDF • 4.2 MB
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-[#0F172A] leading-tight group-hover:text-[#F2780D] transition-colors">{doc.name}</h4>
                  <p className="text-xs font-semibold text-[#94A3B8]">{user.program?.split('in ')[1] || 'General'} • {doc.category}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.uploadTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <Button className="bg-[#F2780D] hover:bg-[#D96B0B] text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm shadow-orange-500/20" asChild>
                    <a href={doc.storagePath || STABLE_PDF_URL} download={`${doc.name}.pdf`}>
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Missing Resource Card placeholder */}
          <div className="rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white/50 flex flex-col items-center justify-center text-center p-8 space-y-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors">
            <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#CBD5E1]" />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-sm">Missing a resource?</p>
              <p className="text-[10px] text-[#94A3B8] mt-1 font-bold uppercase tracking-widest">Request document upload</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Banner */}
      <div className="bg-[#0F172A] rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-white shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-xl">
          <h3 className="text-3xl font-bold tracking-tight">Need Academic Help?</h3>
          <p className="text-[#94A3B8] leading-relaxed">
            Our tutoring center is now open 24/7 online. Get help with coding, mathematics, or technical writing from senior students and faculty.
          </p>
          <Button className="bg-[#F2780D] hover:bg-[#D96B0B] text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-orange-500/20 transition-all active:scale-95">
            Book a Session
          </Button>
        </div>
        
        <div className="absolute right-12 bottom-12 flex items-center gap-2">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <Avatar key={i} className="h-10 w-10 border-2 border-[#0F172A] ring-2 ring-white/10">
                <AvatarImage src={`https://picsum.photos/seed/student${i}/200/200`} />
                <AvatarFallback>S</AvatarFallback>
              </Avatar>
            ))}
            <div className="h-10 w-10 border-2 border-[#0F172A] ring-2 ring-white/10 bg-[#1E293B] flex items-center justify-center text-[10px] font-bold rounded-full">
              +12
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-8 pb-12 flex flex-col md:flex-row items-center justify-between border-t border-[#F1F5F9] gap-4">
        <p className="text-xs font-bold text-[#94A3B8]">© 2023 CICS University Portal. All educational materials are protected.</p>
        <div className="flex gap-6 text-xs font-bold text-[#64748B]">
          <button className="hover:text-primary transition-colors">Privacy Policy</button>
          <button className="hover:text-primary transition-colors">Terms of Service</button>
          <button className="hover:text-primary transition-colors">Support</button>
        </div>
      </footer>
    </div>
  );
}
