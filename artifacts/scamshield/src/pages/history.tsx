import React, { useState } from "react";
import { Link } from "wouter";
import { useListAnalyses, useDeleteAnalysis, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ExternalLink, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ThreatBadge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function History() {
  const [page, setPage] = useState(0);
  const limit = 10;
  const offset = page * limit;

  const queryClient = useQueryClient();
  const { data: analyses, isLoading } = useListAnalyses({ limit, offset });
  const deleteAnalysis = useDeleteAnalysis();

  const handleDelete = (id: number) => {
    deleteAnalysis.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          toast.success("Analysis deleted");
        },
        onError: () => toast.error("Failed to delete analysis")
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scan History</h1>
        <p className="text-muted-foreground">View and manage your past threat analyses.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Scam Type</TableHead>
                  <TableHead>Content Snippet</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : analyses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No scan history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses?.map((analysis) => (
                    <TableRow key={analysis.id} className="group">
                      <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">{analysis.scamType}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                        {analysis.inputContent}
                      </TableCell>
                      <TableCell>
                        <ThreatBadge severity={analysis.severity} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-bold ${
                          analysis.riskScore > 80 ? 'text-destructive' :
                          analysis.riskScore > 60 ? 'text-orange-500' :
                          analysis.riskScore > 30 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {analysis.riskScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/results/${analysis.id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this scan history? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(analysis.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteAnalysis.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={(analyses?.length || 0) < limit || isLoading}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
