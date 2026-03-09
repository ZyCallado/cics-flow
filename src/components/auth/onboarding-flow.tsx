
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const PROGRAMS = [
  "Bachelor of Library and Information Science",
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Digital Animation Technology",
  "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Game Development",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information System"
];

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

interface OnboardingFlowProps {
  userId: string;
  onComplete: (program: string, yearLevel: string) => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedProgram || !selectedYear || !db) return;
    
    setIsSubmitting(true);
    const userRef = doc(db, 'users', userId);
    
    updateDocumentNonBlocking(userRef, {
      program: selectedProgram,
      yearLevel: selectedYear,
      updatedAt: serverTimestamp(),
    });

    // We simulate a small delay for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      onComplete(selectedProgram, selectedYear);
      toast({
        title: "Profile Updated",
        description: `Welcome to the CICS Portal! You are now set up as a ${selectedYear} student.`,
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <Card className="max-w-lg w-full shadow-2xl border-none">
        <div className="h-2 bg-primary rounded-t-lg" />
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Welcome to CICS Portal!</CardTitle>
          <CardDescription className="text-base">
            To provide you with the most relevant documents, please select your details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Your Program</Label>
            <Select onValueChange={setSelectedProgram} value={selectedProgram}>
              <SelectTrigger id="program" className="h-12">
                <SelectValue placeholder="Select your degree program" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map(program => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Your Year Level</Label>
            <RadioGroup 
              value={selectedYear} 
              onValueChange={setSelectedYear}
              className="grid grid-cols-2 gap-3"
            >
              {YEAR_LEVELS.map((year) => (
                <div key={year} className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                  <RadioGroupItem value={year} id={year} />
                  <Label htmlFor={year} className="flex-1 cursor-pointer font-medium">{year}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="p-3 bg-accent/50 rounded-lg flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              You can change these preferences later in your account settings.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
            disabled={!selectedProgram || !selectedYear || isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Setup"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
            Authorized @neu.edu.ph Student Access
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
