"use client";

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
  Calendar,
  Search,
  History,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

const STABLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

interface MyDownloadsViewerProps {
  user: User;
}

export function MyDownloadsViewer({ user }: MyDownloadsViewerProps) {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const downloadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'downloads'), orderBy('recordedAt', 'desc'));
  }, [db, user]);

  const { data: downloads, isLoading } = useCollection<AppDocument>(downloadsQuery);

  const filteredDocs = downloads?.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url || STABLE_PDF_URL;
    link.download = `${name}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = (docId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'downloads', docId));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#0F172A]">My Personal Library</h2>
          <p className="text-[#64748B]">Quick access to documents you've previously downloaded.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input 
            placeholder="Search your library..." 
            className="pl-10 h-11 bg-white border-[#E2E8F0] rounded-xl focus-visible:ring-primary/20 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#64748B]">
          <Loader2 className="h-10 w-10 animate-spin text-[#F2780D] mb-4" />
          <p className="font-semibold">Retrieving library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-3xl border-2 border-dashed border-[#E2E8F0] space-y-6">
          <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center">
            <History className="h-10 w-10 text-[#CBD5E1]" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-[#0F172A]">No downloaded resources</p>
            <p className="text-sm text-[#94A3B8] max-w-xs mx-auto">Documents you download from the main dashboard will automatically appear here for offline reference.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="border-none shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-[#0F172A] leading-tight line-clamp-2 min-h-[2.5rem]">{doc.name}</h4>
                  <Badge variant="secondary" className="bg-[#F8FAFC] text-[#94A3B8] border-none text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {doc.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {(doc as any).downloadedAt ? new Date((doc as any).downloadedAt).toLocaleDateString() : 'Recent'}
                  </div>
                  <Button 
                    variant="outline"
                    className="rounded-xl h-9 px-4 text-xs font-bold border-[#F1F5F9] hover:bg-[#F8FAFC]"
                    onClick={() => handleDownload(doc.storagePath, doc.name)}
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
