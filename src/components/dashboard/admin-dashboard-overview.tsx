
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  LogIn, 
  ArrowUpRight, 
  Download, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Line,
  LineChart
} from "recharts";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Document as AppDocument, User as AppUser, AuditLog } from '@/lib/types';

interface AdminDashboardOverviewProps {
  onNavigate: (tab: string, sort?: 'newest' | 'popular') => void;
}

export function AdminDashboardOverview({ onNavigate }: AdminDashboardOverviewProps) {
  const db = useFirestore();
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Queries for real data
  const recentDocsQuery = useMemoFirebase(() => db ? query(collection(db, 'documents'), orderBy('uploadTimestamp', 'desc'), limit(5)) : null, [db]);
  const topDocsQuery = useMemoFirebase(() => db ? query(collection(db, 'documents'), orderBy('downloadCount', 'desc'), limit(4)) : null, [db]);
  const allDocsQuery = useMemoFirebase(() => db ? collection(db, 'documents') : null, [db]);
  const usersQuery = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(200)) : null, [db]);

  const { data: recentDocs } = useCollection<AppDocument>(recentDocsQuery);
  const { data: topDocs } = useCollection<AppDocument>(topDocsQuery);
  const { data: allDocs } = useCollection<AppDocument>(allDocsQuery);
  const { data: allUsers } = useCollection<AppUser>(usersQuery);
  const { data: recentLogs } = useCollection<AuditLog>(logsQuery);

  // Calculate real stats
  const stats = useMemo(() => {
    const activeThreshold = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();

    return {
      totalDocs: allDocs?.length || 0,
      totalUsers: allUsers?.filter(u => u.role === 'student').length || 0,
      activeNow: allUsers?.filter(u => {
        if (!u.lastLogin) return false;
        const lastSeen = new Date(u.lastLogin).getTime();
        return now - lastSeen < activeThreshold;
      }).length || 0,
      dailyLogins: recentLogs?.filter(l => {
        const logDate = new Date(l.timestamp);
        const isToday = logDate.toDateString() === new Date().toDateString();
        return isToday && l.action.toLowerCase().includes('login');
      }).length || 0
    };
  }, [allDocs, allUsers, recentLogs]);

  // Generate chart data from real logs
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[days[d.getDay()]] = 0;
    }

    if (recentLogs) {
      recentLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const dayName = days[logDate.getDay()];
        // Only count logins for current week days we initialized
        if (counts[dayName] !== undefined && log.action.toLowerCase().includes('login')) {
          counts[dayName]++;
        }
      });
    }

    // Sort to ensure correct sequence Mon-Sun (or whatever the current 7-day window is)
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const name = days[d.getDay()];
      result.push({ name, total: counts[name] });
    }
    return result;
  }, [recentLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">CICS Portal Dashboard</h1>
          <p className="text-[#64748B] text-sm mt-1">Institutional Document Analytics & Management Control</p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-[#F1F5F9]">
          {['daily', 'weekly', 'monthly'].map((f) => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              className={`rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider transition-all ${
                filter === f ? 'bg-[#0F172A] text-white hover:bg-[#0F172A] hover:text-white shadow-md' : 'text-[#64748B]'
              }`}
              onClick={() => setFilter(f as any)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Real-time
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Documents</p>
              <h3 className="text-3xl font-bold text-[#0F172A] mt-1">{stats.totalDocs.toLocaleString()}</h3>
              <div className="mt-4 h-1 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[100%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <LogIn className="h-6 w-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1">
                Live Activity
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Student Logins (Today)</p>
              <h3 className="text-3xl font-bold text-[#0F172A] mt-1">{stats.dailyLogins.toLocaleString()}</h3>
              <div className="mt-4 flex gap-1 items-end h-8">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 bg-amber-200 rounded-t-sm" style={{ height: `${Math.min(100, (d.total / (stats.dailyLogins || 1)) * 100)}%` }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Active Users Right Now</p>
              <h3 className="text-3xl font-bold text-[#0F172A] mt-1">{stats.activeNow}</h3>
              <p className="text-[10px] text-[#94A3B8] mt-2 font-medium italic">Based on last 15 mins activity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Login Frequency</CardTitle>
              <p className="text-xs text-[#94A3B8]">Student access activity over the last 7 days</p>
            </div>
            <Badge variant="secondary" className="bg-[#F8FAFC] text-[#64748B] border-none font-bold text-[10px] py-1 px-3 rounded-lg">
              Past 7 Days
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#F2780D" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#F2780D' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Top Downloaded Docs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {topDocs && topDocs.length > 0 ? topDocs.map((doc, idx) => (
              <div key={doc.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-orange-50 text-primary rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] group-hover:text-[#F2780D] transition-colors">{doc.name}</p>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{(doc.downloadCount || 0).toLocaleString()} downloads</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#CBD5E1]">#{idx + 1}</span>
              </div>
            )) : (
              <p className="text-center py-12 text-[#94A3B8] text-sm">No download data available.</p>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4 rounded-xl border-[#F1F5F9] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() => onNavigate('all-docs', 'popular')}
            >
              View All Stats
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Recent Document Uploads</CardTitle>
          <Button 
            variant="ghost" 
            className="text-[#F2780D] font-bold text-xs hover:bg-orange-50"
            onClick={() => onNavigate('all-docs', 'newest')}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-y border-[#F1F5F9]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Document Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Uploader</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentDocs && recentDocs.length > 0 ? (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-[#0F172A]">{doc.name}</td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">{doc.uploaderName}</td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">{doc.category}</td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">
                        {doc.uploadTimestamp ? new Date(doc.uploadTimestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] px-2 py-0.5">Active</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#94A3B8] text-sm">
                      No recent uploads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
