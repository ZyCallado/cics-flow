"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Document as AppDocument, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Loader2,
  LayoutGrid,
  List,
  Calendar,
  Search,
  Eye,
  ExternalLink
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
  const [searchTerm, setSearchTerm] = useState('');

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
  }, [db]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => {
    const matchesCategory = selectedCategory === 'All Resources' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const handleDownload = (e: React.MouseEvent, url: string, name: string) => {
    // Basic download helper
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#0F172A]">Student Dashboard</h2>
          <p className="text-[#64748B]">
            Welcome back, <span className="text-[#0F172A] font-semibold">{user.name}</span>. Explore resources for <span className="text-primary font-semibold">{user.program || 'your program'}</span>.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input 
            placeholder="Search by title or topic..." 
            className="pl-10 h-11 bg-white border-[#E2E8F0] rounded-xl focus-visible:ring-primary/20 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs defaultValue="All Resources" onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="bg-transparent border-none h-auto p-0 gap-8 overflow-x-auto w-full justify-start no-scrollbar">
          {CATEGORIES.map(cat => (
            <TabsTrigger 
              key={cat} 
              value={cat}
              className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-[#F2780D] data-[state=active]:text-[#F2780D] data-[state=active]:shadow-none rounded-none text-[#64748B] font-semibold transition-all h-auto whitespace-nowrap"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Documents Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#0F172A]">
          {selectedCategory} {searchTerm && `• Results for "${searchTerm}"`}
        </h3>
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
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-[#E2E8F0] space-y-4">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#CBD5E1]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-[#0F172A]">No resources found</p>
            <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-[#F2780D]" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-[#F8FAFC] text-[#64748B] border-none text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      PDF • 4.2 MB
                    </Badge>
                    <a 
                      href={doc.storagePath || STABLE_PDF_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] flex items-center gap-1 text-[#F2780D] font-bold hover:underline"
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </a>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-[#0F172A] leading-tight group-hover:text-[#F2780D] transition-colors line-clamp-2 min-h-[2.5rem]">{doc.name}</h4>
                  <p className="text-xs font-semibold text-[#94A3B8] truncate">{doc.category}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.uploadTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <Button 
                    className="bg-[#F2780D] hover:bg-[#D96B0B] text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm shadow-orange-500/20"
                    onClick={(e) => handleDownload(e, doc.storagePath || STABLE_PDF_URL, doc.name)}
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Missing Resource Card placeholder */}
          {viewMode === 'grid' && (
            <div className="rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white/50 flex flex-col items-center justify-center text-center p-8 space-y-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors">
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#CBD5E1]" />
              </div>
              <div>
                <p className="font-bold text-[#0F172A] text-sm">Missing a resource?</p>
                <p className="text-[10px] text-[#94A3B8] mt-1 font-bold uppercase tracking-widest">Request document upload</p>
              </div>
            </div>
          )}
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
