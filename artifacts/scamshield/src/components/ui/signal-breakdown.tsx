import React from "react";
import { Shield, CheckCircle2, AlertTriangle, XCircle, Clock, HelpCircle } from "lucide-react";
import type { SignalBreakdown } from "@workspace/api-client-react";

interface SignalBreakdownCardProps {
  signals: SignalBreakdown;
}

interface SourceRowProps {
  name: string;
  score: number;
  verdict: string;
  weight: number;
  available: boolean;
  detail?: React.ReactNode;
  error?: string;
  tag?: React.ReactNode;
}

function verdictColor(verdict: string, available: boolean): string {
  if (!available) return "text-muted-foreground";
  switch (verdict) {
    case "malicious":
    case "phishing":
    case "unsafe":
    case "very_new":
      return "text-destructive";
    case "suspicious":
    case "low-risk":
    case "new":
      return "text-amber-500";
    case "clean":
    case "safe":
    case "not_listed":
    case "established":
      return "text-green-500";
    case "submitted":
    case "recent":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function verdictIcon(verdict: string, available: boolean) {
  if (!available) return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  switch (verdict) {
    case "malicious":
    case "phishing":
    case "unsafe":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "suspicious":
    case "low-risk":
    case "very_new":
    case "new":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "clean":
    case "safe":
    case "not_listed":
    case "established":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "submitted":
    case "recent":
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function formatVerdict(verdict: string): string {
  return verdict.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScoreBar({ score, available }: { score: number; available: boolean }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    !available ? "bg-muted" :
    pct >= 70 ? "bg-destructive" :
    pct >= 40 ? "bg-amber-500" :
    "bg-green-500";

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${available ? pct : 0}%` }}
        />
      </div>
      <span className="text-xs font-mono w-7 text-right text-muted-foreground">
        {available ? pct : "—"}
      </span>
    </div>
  );
}

function SourceRow({ name, score, verdict, weight, available, detail, error, tag }: SourceRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0 border-border/50">
      <div className="flex-shrink-0 mt-0.5">{verdictIcon(verdict, available)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground font-mono">({Math.round(weight * 100)}% weight)</span>
          {tag}
        </div>
        <div className={`text-xs font-medium ${verdictColor(verdict, available)}`}>
          {available ? formatVerdict(verdict) : (error ? "Unavailable" : "Skipped")}
        </div>
        {available && detail && (
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        )}
        {!available && error && (
          <div className="mt-0.5 text-xs text-muted-foreground/60 truncate">{error}</div>
        )}
      </div>
      <div className="flex-shrink-0 w-28">
        <ScoreBar score={score} available={available} />
      </div>
    </div>
  );
}

export function SignalBreakdownCard({ signals }: SignalBreakdownCardProps) {
  const geminiScore = signals.gemini?.score ?? 0;
  const geminiWeight = signals.gemini?.weight ?? 0.5;
  const geminiVerdict = geminiScore >= 60 ? "suspicious" : "clean";

  const vt = signals.virustotal;
  const sb = signals.google_safe_browsing;
  const pt = signals.phishtank;
  const da = signals.domain_age;
  const ensembleScore = signals.ensembleScore ?? 0;

  return (
    <div className="space-y-1">
      <SourceRow
        name="Gemini AI"
        score={geminiScore}
        verdict={geminiVerdict}
        weight={geminiWeight}
        available={true}
        detail="Multimodal LLM analysis of URL content and context"
        tag={<span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">Primary</span>}
      />

      {vt != null && (
        <SourceRow
          name="VirusTotal"
          score={vt.score ?? 0}
          verdict={vt.verdict ?? "unknown"}
          weight={vt.weight ?? 0}
          available={vt.available ?? false}
          error={vt.error}
          detail={
            vt.available && vt.verdict !== "submitted"
              ? `${vt.malicious ?? 0} malicious · ${vt.suspicious ?? 0} suspicious · ${vt.harmless ?? 0} harmless · ${vt.undetected ?? 0} undetected`
              : vt.verdict === "submitted" ? "URL submitted for scanning — results pending" : undefined
          }
        />
      )}

      {sb != null && (
        <SourceRow
          name="Google Safe Browsing"
          score={sb.score ?? 0}
          verdict={sb.verdict ?? "unknown"}
          weight={sb.weight ?? 0}
          available={sb.available ?? false}
          error={sb.error}
          detail={
            sb.available
              ? (sb.threats ?? []).length > 0
                ? `Threats: ${(sb.threats ?? []).map((t) => t.toLowerCase().replace(/_/g, " ")).join(", ")}`
                : "No threats found in Google's database"
              : undefined
          }
        />
      )}

      {pt != null && (
        <SourceRow
          name="Heuristic URL Analysis"
          score={pt.score ?? 0}
          verdict={pt.verdict ?? "unknown"}
          weight={pt.weight ?? 0}
          available={pt.available ?? false}
          error={pt.error}
          tag={<span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">local</span>}
          detail={
            pt.available
              ? (pt as { matchedIndicators?: string[] }).matchedIndicators?.length
                ? (pt as { matchedIndicators?: string[] }).matchedIndicators!.join(" · ")
                : "No suspicious URL patterns detected"
              : undefined
          }
        />
      )}

      {da != null && (
        <SourceRow
          name="Domain Age (RDAP)"
          score={da.score ?? 0}
          verdict={da.verdict ?? "unknown"}
          weight={da.weight ?? 0}
          available={da.available ?? false}
          error={da.error}
          detail={
            da.available && da.ageInDays != null
              ? `${da.domain} · Registered ${da.ageInDays} day${da.ageInDays === 1 ? "" : "s"} ago${da.registrationDate ? ` (${new Date(da.registrationDate).toLocaleDateString()})` : ""}`
              : undefined
          }
        />
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between bg-muted/30 rounded-b-lg px-3 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Ensemble Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Weighted blend of all sources</span>
          <span className={`text-lg font-bold font-mono ${
            ensembleScore >= 70 ? "text-destructive" :
            ensembleScore >= 40 ? "text-amber-500" :
            "text-green-500"
          }`}>
            {ensembleScore}
          </span>
        </div>
      </div>
    </div>
  );
}
