
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const PROGRAMS = [
  "Bachelor of Science in Computer Science (BSCS)",
  "Bachelor of Science in Information Technology (BSIT)",
  "Bachelor of Science in Information Systems (BSIS)",
  "Associate in Computer Technology (ACT)"
];

interface OnboardingFlowProps {
  userId: string;
  onComplete: (program: string) => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedProgram || !db) return;
    
    setIsSubmitting(true);
    const userRef = doc(db, 'users', userId);
    
    updateDocumentNonBlocking(userRef, {
      program: selectedProgram,
      updatedAt: serverTimestamp(),
    });

    // We simulate a small delay for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      onComplete(selectedProgram);
      toast({
        title: "Profile Updated",
        description: `Welcome to the CICS Flow portal, ${selectedProgram.split('(')[1]?.replace(')', '') || 'student'}!`,
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <Card className="max-w-md w-full shadow-2xl border-none">
        <div className="h-2 bg-primary rounded-t-lg" />
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Finish your Profile</CardTitle>
          <CardDescription>
            Help us personalize your experience by selecting your academic program.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program">Undergraduate Program</Label>
            <Select onValueChange={setSelectedProgram} value={selectedProgram}>
              <SelectTrigger id="program" className="h-12">
                <SelectValue placeholder="Select your program" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map(program => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 bg-accent/50 rounded-lg flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This helps us show you documents and announcements relevant to your specific course of study.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-12 text-lg font-medium" 
            disabled={!selectedProgram || isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Start Document Flow"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
