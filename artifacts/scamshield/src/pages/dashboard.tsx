import React from "react";
import { Link } from "wouter";
import { useGetStatsSummary, useGetRecentThreats, useGetScamTypeBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Activity, Shield, ArrowRight } from "lucide-react";
import { ThreatBadge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: recentThreats, isLoading: threatsLoading } = useGetRecentThreats();
  const { data: breakdown, isLoading: breakdownLoading } = useGetScamTypeBreakdown();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your threat landscape and scanning activity.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{stats?.totalAnalyses}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Found</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold text-destructive">{stats?.highRiskCount}</div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Items</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
             {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats?.safeCount}</div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Today</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
             {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{stats?.scamsBlockedToday}</div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Threat Breakdown</CardTitle>
            <CardDescription>Most common scam types detected.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {breakdownLoading ? (
              <div className="h-full flex items-end gap-2 pt-10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
            ) : breakdown && breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="scamType" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'var(--color-muted)', opacity: 0.4}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No threat data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Threats Feed */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent High-Risk Threats</CardTitle>
            <CardDescription>Latest critical and high severity alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            {threatsLoading ? (
               <div className="space-y-4">
                 {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                 ))}
               </div>
            ) : recentThreats && recentThreats.length > 0 ? (
              <div className="space-y-6">
                {recentThreats.map((threat) => (
                  <div key={threat.id} className="flex items-start gap-4 border-b border-border/50 last:border-0 pb-4 last:pb-0">
                    <div className="mt-1">
                      <ThreatBadge severity={threat.severity} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{threat.scamType}</p>
                      <p className="text-xs text-muted-foreground font-mono line-clamp-1">
                        {threat.inputContent}
                      </p>
                      <div className="flex items-center pt-2">
                        <Link href={`/results/${threat.id}`} className="text-xs text-primary font-medium flex items-center hover:underline">
                          View Analysis <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(threat.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">
                No high-risk threats detected recently.<br/>Stay vigilant!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
