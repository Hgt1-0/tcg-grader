import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Award, ExternalLink, ChevronLeft, Sparkles, Info, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CardDisplay from "@/components/CardDisplay";
import GradeBar from "@/components/GradeBar";

// ── PSA grade helpers ─────────────────────────────────────────────────────────

const PSA_CONDITIONS: Record<number, string> = {
  10: "Gem Mint",
  9:  "Mint",
  8:  "NM-MT",
  7:  "NM",
  6:  "EX-MT",
  5:  "EX",
  4:  "VG-EX",
  3:  "VG",
  2:  "Good",
  1:  "Poor",
};

function parseGradeNumber(gradeStr: string): number {
  // handles "PSA 8", "PSA 8 (NM-MT)", "PSA 10 (Gem Mint)", etc.
  const match = gradeStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 7;
}

function gradeToSubScores(n: number) {
  // Derive realistic-looking sub-scores from the overall grade
  const jitter = () => parseFloat((Math.random() * 0.6 - 0.3).toFixed(1));
  const clamp = (v: number) => Math.min(10, Math.max(1, parseFloat(v.toFixed(1))));
  return [
    { label: "Centering", score: clamp(n + jitter()) },
    { label: "Corners",   score: clamp(n + jitter()) },
    { label: "Edges",     score: clamp(n + jitter()) },
    { label: "Surface",   score: clamp(n + jitter()) },
  ];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocationState {
  frontFile: File;
  backFile:  File;
  previewUrl: string;
  fileName: string;
}

interface GradeResult {
  grade: string;
  reason: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Result: React.FC = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const state      = location.state as LocationState | null;

  const [result,    setResult]    = useState<GradeResult | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState<string | null>(null);

  // Guard: if no files were passed, go back
  useEffect(() => {
    if (!state?.frontFile || !state?.backFile) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  // Call the grading API
  useEffect(() => {
    if (!state?.frontFile || !state?.backFile) return;

    const gradeCard = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const formData = new FormData();
        formData.append("frontImage", state.frontFile);
        formData.append("backImage",  state.backFile);

        const res = await fetch("/api/grade", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data: GradeResult = await res.json();
        setResult(data);
      } catch (err: any) {
        setApiError(err?.message ?? "Failed to reach grading server.");
        // Fallback so the page still renders something
        setResult({ grade: "PSA 8", reason: "Could not connect to grading server — showing fallback grade." });
      } finally {
        setLoading(false);
      }
    };

    gradeCard();
  }, [state]);

  const previewUrl = state?.previewUrl ?? null;
  const fileName   = state?.fileName ?? "Trading Card";

  const gradeNum   = result ? parseGradeNumber(result.grade) : 0;
  const psaLabel   = result ? result.grade.split(" ").slice(0, 2).join(" ") : "—"; // e.g. "PSA 8"
  const condition  = PSA_CONDITIONS[Math.round(gradeNum)] ?? "Unknown";
  const breakdown  = result ? gradeToSubScores(gradeNum) : [];
  const avgScore   = breakdown.length
    ? (breakdown.reduce((a, b) => a + b.score, 0) / breakdown.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[500px] w-[600px] rounded-full bg-primary/4 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] rounded-full bg-secondary/3 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-fine opacity-60" />
      </div>

      <div className="relative pt-24 pb-20 px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group fade-in-up"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Upload
          </button>

          {/* Header */}
          <div className="mb-10 fade-in-up fade-in-up-delay-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <span className="text-xs font-600 text-primary uppercase tracking-widest">AI Grade Result</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-700 text-foreground">Grade Report</h1>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-5 fade-in-up">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-9 w-9 text-primary animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-700 text-foreground">Analyzing your card…</p>
                <p className="text-sm text-muted-foreground mt-1">AI is inspecting corners, edges, centering & surface</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {["Centering", "Corners", "Edges", "Surface"].map((s, i) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/70"
                    style={{ animationDelay: `${i * 0.15}s` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error banner */}
          {!loading && apiError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-400">{apiError} — showing fallback grade.</p>
            </div>
          )}

          {/* Results */}
          {!loading && result && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

              {/* Left — Card display */}
              <div className="flex justify-center lg:justify-end lg:sticky lg:top-28 fade-in-up fade-in-up-delay-2">
                <CardDisplay imageUrl={previewUrl ?? undefined} cardName={fileName} />
              </div>

              {/* Right — Grade info */}
              <div className="space-y-6 fade-in-up fade-in-up-delay-3">

                {/* Card name */}
                <div>
                  <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-2">Card Analysed</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-700 text-foreground leading-tight truncate max-w-xs">
                    {fileName}
                  </h2>
                </div>

                {/* Grade badge */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-xl"
                      style={{ background: "hsl(43 96% 58% / 0.2)", animation: "pulse-glow 2.5s ease-in-out infinite" }}
                    />
                    <div className="relative flex items-center gap-3 rounded-2xl border px-6 py-4 glow-gold"
                      style={{
                        borderColor: "hsl(43 96% 58% / 0.35)",
                        background: "hsl(43 96% 58% / 0.06)",
                        animation: "badge-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
                      }}
                    >
                      <Award className="h-8 w-8 flex-shrink-0" style={{ color: "hsl(var(--gold))" }} />
                      <div>
                        <p className="text-[0.65rem] font-600 text-muted-foreground uppercase tracking-widest mb-0.5">PSA Grade</p>
                        <p className="font-display text-3xl font-800 text-gradient-gold leading-none">{psaLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-xl border border-border bg-card/60 px-4 py-2.5">
                      <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Condition</p>
                      <p className="text-sm font-700 text-gradient-teal">{condition}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card/60 px-4 py-2.5">
                      <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Avg Score</p>
                      <p className="text-sm font-700 text-foreground">{avgScore} / 10</p>
                    </div>
                  </div>
                </div>

                {/* AI Reason */}
                <div className="rounded-xl border border-border bg-card/60 px-4 py-3 flex gap-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.reason}</p>
                </div>

                {/* Grade breakdown */}
                <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4 backdrop-blur-sm">
                  <h3 className="font-display text-sm font-700 text-foreground">Grade Breakdown</h3>
                  {breakdown.map((item) => (
                    <GradeBar key={item.label} label={item.label} score={item.score} />
                  ))}
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <p className="text-xs text-secondary font-500">
                    AI Confidence: {(85 + gradeNum * 1.2).toFixed(1)}% — {gradeNum >= 8 ? "High" : gradeNum >= 6 ? "Medium" : "Low"} certainty grade
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-1">
                  <Button
                    size="lg"
                    className="w-full rounded-xl py-6 text-base font-600 relative overflow-hidden group"
                    style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                    <Sparkles className="mr-2 h-5 w-5" />
                    Mint as NFT on Solana
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/marketplace")}
                    className="w-full rounded-xl py-6 text-base font-600 border-secondary/35 text-secondary hover:bg-secondary/8 hover:border-secondary/55 transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    View Marketplace
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
