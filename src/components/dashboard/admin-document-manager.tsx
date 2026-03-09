
"use client";

import { useState, useRef } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Document as AppDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Loader2,
  FilePlus,
  Filter,
  Upload
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Academic', 'Administrative', 'Faculty', 'Research', 'Student Services', 'Other'];

export function AdminDocumentManager() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Firestore Collection Reference
  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'));
  }, [db]);

  const { data: documents, isLoading } = useCollection<AppDocument>(docsQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploaderName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only PDF documents are allowed."
        });
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
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
      storagePath: selectedFile ? `https://neu.edu.ph/docs/simulated/${selectedFile.name}` : (editingDoc?.storagePath || `https://neu.edu.ph/docs/${Date.now()}.pdf`),
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
      setSelectedFile(null);
      toast({ title: "Document Updated", description: "Metadata has been saved successfully." });
    } else {
      const newDocRef = doc(collection(db, 'documents'));
      setDocumentNonBlocking(newDocRef, {
        ...docData,
        id: newDocRef.id,
        createdAt: serverTimestamp(),
      }, { merge: true });
      setIsCreateOpen(false);
      setSelectedFile(null);
      toast({ title: "Document Created", description: "New document entry added to system." });
    }
  };

  const confirmDelete = () => {
    if (!db || !deletingDocId) return;
    const docRef = doc(db, 'documents', deletingDocId);
    deleteDocumentNonBlocking(docRef);
    setDeletingDocId(null);
    toast({ variant: "destructive", title: "Document Deleted", description: "Record has been removed from system." });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Manage Documents</h2>
          <p className="text-muted-foreground">Admin-only workspace for institutional documents.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setSelectedFile(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <FilePlus className="mr-2 h-4 w-4" />
              Upload New Metadata
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Document Record</DialogTitle>
              <DialogDescription>
                Create a new document entry and upload the PDF file.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDocument} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Title</Label>
                <Input id="name" name="name" placeholder="e.g., Faculty Handbook 2024" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="Administrative">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief summary of the document content..." className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF Document</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="file" 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Strictly PDF files only.</p>
              </div>
              <DialogFooter>
                <Button type="submit">Create Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, category, or uploader..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading document registry...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No documents found matching your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/50">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{doc.uploaderName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(doc.uploadTimestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDoc(doc)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingDocId(doc.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.storagePath} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingDoc && (
        <Dialog open={!!editingDoc} onOpenChange={(open) => {
          if (!open) {
            setEditingDoc(null);
            setSelectedFile(null);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Document Metadata</DialogTitle>
              <DialogDescription>
                Update the metadata for {editingDoc.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDocument} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Title</Label>
                <Input id="name" name="name" defaultValue={editingDoc.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingDoc.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingDoc.description} className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-edit">Replace Document (PDF)</Label>
                <Input 
                  id="file-edit" 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Leave blank to keep existing file.</p>
              </div>
              <DialogFooter>
                <Button type="submit">Update Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document record
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
