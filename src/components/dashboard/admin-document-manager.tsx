"use client";

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Document as AppDocument } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  Plus,
  AlertCircle,
  Download,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Lecture Notes', 'Research Papers', 'Exam Prep', 'Reference Materials', 'Administrative'];
const STABLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface AdminDocumentManagerProps {
  initialSort?: 'newest' | 'popular' | 'alphabetical';
}

export function AdminDocumentManager({ initialSort = 'newest' }: AdminDocumentManagerProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>(initialSort);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSort) setSortBy(initialSort);
  }, [initialSort]);

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q;
    if (sortBy === 'newest') {
      q = query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
    } else if (sortBy === 'popular') {
      q = query(collection(db, 'documents'), orderBy('downloadCount', 'desc'));
    } else {
      q = query(collection(db, 'documents'), orderBy('name', 'asc'));
    }
    return q;
  }, [db, sortBy]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid File Format",
          description: "Only PDF documents are authorized for upload.",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSaveDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    if (!editingDoc && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "A PDF file is required to upload a new document.",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const formattedSize = selectedFile ? formatBytes(selectedFile.size) : (editingDoc?.formattedSize || 'N/A');
    
    const docData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      type: 'application/pdf',
      storagePath: STABLE_PDF_URL,
      uploaderId: user.uid,
      uploaderName: user.email?.split('@')[0] || 'Administrator',
      uploadTimestamp: new Date().toISOString(),
      permissions: ['admin'],
      updatedAt: new Date().toISOString(),
      formattedSize: formattedSize,
    };

    if (editingDoc) {
      const docRef = doc(db, 'documents', editingDoc.id);
      updateDocumentNonBlocking(docRef, {
        ...docData,
        updatedAt: serverTimestamp(),
      });
      setEditingDoc(null);
      toast({ title: "Document Updated" });
    } else {
      const newDocRef = doc(collection(db, 'documents'));
      setDocumentNonBlocking(newDocRef, {
        ...docData,
        id: newDocRef.id,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });
      setIsCreateOpen(false);
      toast({ title: "Document Uploaded" });
    }
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Documents Management</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage, upload, and organize corporate PDF assets.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-none shadow-sm bg-white font-bold text-[#64748B]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setSelectedFile(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#F2780D] hover:bg-[#D96B0B] text-white px-6 py-6 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95">
                <Plus className="mr-2 h-5 w-5" />
                Upload New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">New Document</DialogTitle>
                <DialogDescription>Add a new PDF asset to the system registry.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveDocument} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                  <Input name="name" placeholder="Document Name" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select name="category" defaultValue="Lecture Notes">
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea name="description" placeholder="Brief description..." className="rounded-xl min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDF File</Label>
                  <div className="relative">
                    <Input 
                      ref={fileInputRef}
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleFileChange} 
                      required 
                      className="h-12 rounded-xl cursor-pointer py-2 pr-10" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                  {selectedFile && (
                    <p className="text-[10px] text-primary font-bold">Size Detected: {formatBytes(selectedFile.size)}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-medium italic">Requirement: Only .pdf files are accepted.</p>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-12 bg-[#F2780D] hover:bg-[#D96B0B] rounded-xl font-bold">Upload Document</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
        <Input 
          placeholder="Search documents by title or category..." 
          className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm text-lg focus-visible:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="hover:bg-transparent border-b border-[#F1F5F9]">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] py-4 pl-6">Title</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Category</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Size</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Downloads</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredDocs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center text-muted-foreground">No documents found.</TableCell></TableRow>
              ) : filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-[#F8FAFC] border-b border-[#F1F5F9] transition-colors group">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#F1F5F9] text-red-500 group-hover:bg-white transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{doc.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">{new Date(doc.uploadTimestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#FEE2E2]/30 text-[#F87171] hover:bg-[#FEE2E2]/50 rounded-lg px-3 py-1 font-medium border-none text-[10px] uppercase tracking-wide">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B] text-xs font-bold">
                    {doc.formattedSize || 'N/A'}
                  </TableCell>
                  <TableCell className="text-[#64748B] text-xs">
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3 w-3 text-primary" />
                      {(doc.downloadCount || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-primary hover:bg-orange-50 rounded-lg" asChild title="View Document">
                        <a href={doc.storagePath || STABLE_PDF_URL} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg" onClick={() => setEditingDoc(doc)} title="Edit Metadata">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => setDeletingDocId(doc.id)} title="Delete Document">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingDoc && (
        <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Metadata</DialogTitle>
              <DialogDescription>Update the details for {editingDoc.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDocument} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input name="name" defaultValue={editingDoc.name} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select name="category" defaultValue={editingDoc.category}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea name="description" defaultValue={editingDoc.description} className="rounded-xl min-h-[100px]" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 bg-[#F2780D] hover:bg-[#D96B0B] rounded-xl font-bold">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
        <AlertDialogContent className="rounded-2xl shadow-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to remove this document from the registry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="rounded-xl border-none bg-muted font-bold h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!db || !deletingDocId) return;
              deleteDocumentNonBlocking(doc(db, 'documents', deletingDocId));
              setDeletingDocId(null);
              toast({ variant: "destructive", title: "Document Deleted" });
            }} className="rounded-xl bg-red-500 hover:bg-red-600 font-bold h-11 text-white">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
