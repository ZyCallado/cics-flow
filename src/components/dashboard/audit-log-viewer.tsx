
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { adminAuditLogAnalysis, AdminAuditLogAnalysisOutput } from '@/ai/flows/admin-audit-log-analysis-flow';
import { AuditLog } from '@/lib/types';

const MOCK_LOGS: AuditLog[] = [
  { id: '1', userId: 'usr_01', email: 'j.doe@neu.edu.ph', action: 'Login Success', timestamp: '2023-10-27 10:15:22', ip: '112.204.1.55', details: 'Normal login via Chrome/macOS' },
  { id: '2', userId: 'usr_02', email: 'm.smith@neu.edu.ph', action: 'Login Failed', timestamp: '2023-10-27 10:16:05', ip: '45.12.33.102', details: 'Invalid password - Geo: unknown' },
  { id: '3', userId: 'usr_02', email: 'm.smith@neu.edu.ph', action: 'Login Failed', timestamp: '2023-10-27 10:16:15', ip: '45.12.33.102', details: 'Invalid password - Geo: unknown' },
  { id: '4', userId: 'usr_02', email: 'm.smith@neu.edu.ph', action: 'Login Success', timestamp: '2023-10-27 10:17:00', ip: '45.12.33.102', details: 'Bypassed lock? Unusual IP pattern' },
  { id: '5', userId: 'usr_03', email: 'faculty@neu.edu.ph', action: 'Document Download', timestamp: '2023-10-27 11:00:10', ip: '112.204.5.12', details: 'Accessed Sensitive_Grades.pdf' },
  { id: '6', userId: 'usr_04', email: 'attacker@gmail.com', action: 'Login Failed', timestamp: '2023-10-27 02:00:00', ip: '185.11.22.33', details: 'Restricted domain attempted access' },
];

export function AuditLogViewer() {
  const [logs] = useState(MOCK_LOGS);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AdminAuditLogAnalysisOutput | null>(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const logString = logs.map(l => `[${l.timestamp}] ${l.email} | ${l.action} | ${l.ip} | ${l.details}`).join('\n');
      const result = await adminAuditLogAnalysis({ auditLogs: logString });
      setInsights(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Security Audit Logs</h2>
          <p className="text-muted-foreground">Monitor system access and activities in real-time.</p>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={analyzing}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {analyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI Insights Analysis
        </Button>
      </div>

      {insights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" /> AI Security Insights
            </CardTitle>
            <CardDescription>AI-driven analysis of recent patterns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.findings.map((finding, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-primary/10 shadow-sm flex gap-4">
                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{finding.description}</h4>
                    <Badge variant={finding.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>{finding.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{finding.suggestion}</p>
                  <div className="text-xs bg-muted/50 p-2 rounded italic">
                    Evidence: {finding.relevantLogs.join('; ')}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="max-w-xs">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.email}</TableCell>
                  <TableCell>
                    <Badge variant={log.action.includes('Failed') ? 'destructive' : 'secondary'}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.ip}</TableCell>
                  <TableCell className="text-sm italic text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
