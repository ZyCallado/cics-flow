
"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Document as AppDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Download, 
  ExternalLink, 
  Filter, 
  Loader2,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['All', 'Academic', 'Administrative', 'Faculty', 'Research', 'Student Services'];
const STABLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

export function StudentDocumentBrowser() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
  }, [db]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Browse Documents</h2>
          <p className="text-muted-foreground">Access official CICS handbooks, forms, and guides.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or keywords..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-11">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="font-medium">Loading document library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-border">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
          <h3 className="text-lg font-bold">No documents found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your search or category filter to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white overflow-hidden flex flex-col">
              <div className="h-24 bg-accent/30 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-accent/50 text-xs">{doc.category}</Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">PDF</span>
                </div>
                <CardTitle className="text-lg font-headline font-bold line-clamp-1">{doc.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                  {doc.description || "No description available."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.uploadTimestamp).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Official Document
                  </div>
                </div>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex gap-2">
                <Button variant="default" className="flex-1 bg-primary hover:bg-primary/90" asChild>
                  <a href={doc.storagePath || STABLE_PDF_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="shrink-0" asChild>
                  <a href={doc.storagePath || STABLE_PDF_URL} download={`${doc.name}.pdf`}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
