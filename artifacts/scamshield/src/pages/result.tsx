import React from "react";
import { useParams, Link } from "wouter";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, ShieldCheck, ShieldAlert, Target, Lightbulb } from "lucide-react";
import { Gauge, ThreatBadge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";

export function Result() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: analysis, isLoading, isError } = useGetAnalysis(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAnalysisQueryKey(id),
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Analysis not found</h2>
        <p className="text-muted-foreground mb-6">This scan may have been deleted or doesn't exist.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Analysis
      </Link>

      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-card border rounded-xl p-6 md:p-8 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ThreatBadge severity={analysis.severity} />
            <Badge variant="outline" className="font-mono">{analysis.inputType.toUpperCase()}</Badge>
            {analysis.simpleMode && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Simple Mode Active</Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{analysis.scamType}</h1>
            <p className="text-muted-foreground font-mono text-sm max-w-2xl bg-muted p-3 rounded-md line-clamp-3">
              {analysis.inputContent}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border min-w-[160px]">
          <Gauge value={analysis.riskScore} />
          <span className="text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-widest">Risk Score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {analysis.riskScore > 50 ? <ShieldAlert className="w-5 h-5 text-destructive" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
                Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base leading-relaxed text-foreground/90">
                {analysis.explanation}
              </p>
              
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-lg">
                  <Target className="w-5 h-5 text-primary" /> Attacker Goal
                </h4>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-foreground/90">
                  {analysis.attackerGoal}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5" /> Red Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {analysis.redFlags.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      <span className="text-foreground/80">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific red flags detected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-950/20 border-b border-green-100 dark:border-green-900 pb-4">
              <CardTitle className="text-green-700 dark:text-green-500 flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5" /> Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {analysis.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span className="text-foreground/80">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No recommendations available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
