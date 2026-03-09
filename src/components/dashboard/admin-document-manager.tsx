"use client";

import { useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Finance', 'HR', 'IT', 'Marketing', 'Administrative', 'Academic'];
const STABLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

export function AdminDocumentManager() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
  }, [db]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const docData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      type: 'application/pdf',
      storagePath: STABLE_PDF_URL,
      uploaderId: user.uid,
      uploaderName: user.displayName || 'Administrator',
      uploadTimestamp: new Date().toISOString(),
      permissions: ['admin'],
      updatedAt: new Date().toISOString(),
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
        createdAt: serverTimestamp(),
      }, { merge: true });
      setIsCreateOpen(false);
      toast({ title: "Document Uploaded" });
    }
    setSelectedFile(null);
  };

  const confirmDelete = () => {
    if (!db || !deletingDocId) return;
    deleteDocumentNonBlocking(doc(db, 'documents', deletingDocId));
    setDeletingDocId(null);
    toast({ variant: "destructive", title: "Document Deleted" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Documents Management</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage, upload, and organize corporate PDF assets.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                <Select name="category" defaultValue="Administrative">
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
                <Input type="file" accept=".pdf" onChange={handleFileChange} required className="h-12 rounded-xl cursor-pointer py-2" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 bg-[#F2780D] hover:bg-[#D96B0B] rounded-xl font-bold">Upload Document</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
        <Input 
          placeholder="Search documents by title, category, or description..." 
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Upload Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Description</TableHead>
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
                      <span className="font-bold text-[#0F172A] text-sm">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#FEE2E2]/30 text-[#F87171] hover:bg-[#FEE2E2]/50 rounded-lg px-3 py-1 font-medium border-none text-[10px] uppercase tracking-wide">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B] text-xs">
                    {new Date(doc.uploadTimestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-[#64748B] text-xs max-w-[300px] truncate">
                    {doc.description}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg" onClick={() => setEditingDoc(doc)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => setDeletingDocId(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between px-6 py-6 border-t border-[#F1F5F9] bg-[#F8FAFC]/50">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              Showing {filteredDocs.length > 0 ? 1 : 0} to {filteredDocs.length} of {filteredDocs.length} documents
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg disabled:opacity-30" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button className="h-8 w-8 bg-[#F2780D] text-white rounded-lg text-xs font-bold shadow-sm">1</Button>
              <Button variant="ghost" className="h-8 w-8 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg text-xs font-bold">2</Button>
              <Button variant="ghost" className="h-8 w-8 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg text-xs font-bold">3</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg disabled:opacity-30" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-red-500 hover:bg-red-600 font-bold h-11 text-white">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
