import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, FileText, Link as LinkIcon, Image as ImageIcon, Loader2, ScanLine } from "lucide-react";
import { useAnalyzeText, useAnalyzeUrl, useAnalyzeImage, useListAnalyses } from "@workspace/api-client-react";
import { ThreatBadge } from "@/components/ui/gauge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getListAnalysesQueryKey } from "@workspace/api-client-react";
import { QrScanner } from "@/components/qr-scanner";

export function Home() {
  const [, setLocation] = useLocation();
  const [simpleMode, setSimpleMode] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  
  const queryClient = useQueryClient();
  const analyzeText = useAnalyzeText();
  const analyzeUrl = useAnalyzeUrl();
  const analyzeImage = useAnalyzeImage();
  
  const { data: recentAnalyses } = useListAnalyses({ limit: 3 });

  const isPending = analyzeText.isPending || analyzeUrl.isPending || analyzeImage.isPending;

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    analyzeText.mutate(
      { data: { content: text, simpleMode } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          setLocation(`/results/${res.id}`);
        },
        onError: () => toast.error("Failed to analyze text")
      }
    );
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    analyzeUrl.mutate(
      { data: { url, simpleMode } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          setLocation(`/results/${res.id}`);
        },
        onError: () => toast.error("Failed to analyze URL")
      }
    );
  };

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrUrl.trim()) return;

    analyzeUrl.mutate(
      { data: { url: qrUrl, simpleMode } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          setLocation(`/results/${res.id}`);
        },
        onError: () => toast.error("Failed to analyze QR code URL"),
      }
    );
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      
      analyzeImage.mutate(
        { data: { imageBase64: base64Data, mimeType: imageFile.type, simpleMode } },
        {
          onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
            setLocation(`/results/${res.id}`);
          },
          onError: () => toast.error("Failed to analyze image")
        }
      );
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Threat Analysis</h1>
        <p className="text-muted-foreground text-lg">
          Paste a message, enter a link, or upload an image. We'll tell you if it's safe.
        </p>
      </div>

      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Simple Mode</Label>
              <p className="text-sm text-muted-foreground">Explain technical details in plain language</p>
            </div>
            <Switch checked={simpleMode} onCheckedChange={setSimpleMode} />
          </div>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="text" className="flex gap-2"><FileText className="w-4 h-4"/> Text</TabsTrigger>
              <TabsTrigger value="url" className="flex gap-2"><LinkIcon className="w-4 h-4"/> URL</TabsTrigger>
              <TabsTrigger value="image" className="flex gap-2"><ImageIcon className="w-4 h-4"/> Image</TabsTrigger>
              <TabsTrigger value="qr" className="flex gap-2"><ScanLine className="w-4 h-4"/> QR Scan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <Textarea 
                  placeholder="Paste email, SMS, or suspicious message here..."
                  className="min-h-[200px] font-mono text-sm resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isPending}
                />
                <Button type="submit" className="w-full" size="lg" disabled={!text.trim() || isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                  Analyze Text
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="url">
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Suspicious Link</Label>
                  <Input 
                    type="url" 
                    placeholder="https://example.com/login" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isPending}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={!url.trim() || isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                  Scan URL
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="image">
              <form onSubmit={handleImageSubmit} className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    disabled={isPending}
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full gap-4">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="font-semibold text-lg">{imageFile ? imageFile.name : "Click to upload image"}</span>
                      <p className="text-muted-foreground mt-1">JPEG, PNG up to 10MB</p>
                    </div>
                  </Label>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={!imageFile || isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                  Analyze Image
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="qr">
              <form onSubmit={handleQrSubmit} className="space-y-4">
                <QrScanner
                  onDetected={(detected) => setQrUrl(detected)}
                  disabled={isPending}
                />
                {qrUrl && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted border border-border font-mono text-xs text-muted-foreground break-all">
                    <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    {qrUrl}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={!qrUrl.trim() || isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                  Analyze QR Code
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {recentAnalyses && recentAnalyses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Scans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {recentAnalyses.map((analysis) => (
              <Link key={analysis.id} href={`/results/${analysis.id}`}>
                <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <ThreatBadge severity={analysis.severity} />
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-base truncate" title={analysis.scamType}>
                      {analysis.scamType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 font-mono bg-muted p-2 rounded">
                      {analysis.inputContent}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
