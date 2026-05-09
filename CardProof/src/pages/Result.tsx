import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Award, ExternalLink, ChevronLeft, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CardDisplay from "@/components/CardDisplay";
import GradeBar from "@/components/GradeBar";

const gradeBreakdown = [
  { label: "Centering", score: 8.5 },
  { label: "Corners", score: 7.5 },
  { label: "Edges", score: 8.0 },
  { label: "Surface", score: 9.0 },
];

const tags = ["Pokémon", "1st Edition", "Holo", "Base Set", "Rare"];

interface LocationState {
  file: File;
  previewUrl: string;
  fileName: string;
}

const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Guard: if no image was passed, send back to upload
  useEffect(() => {
    if (!state?.previewUrl) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  const previewUrl = state?.previewUrl ?? null;
  const fileName = state?.fileName ?? "Trading Card";

  const overallScore = (gradeBreakdown.reduce((a, b) => a + b.score, 0) / gradeBreakdown.length).toFixed(1);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[500px] w-[600px] rounded-full bg-primary/4 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] rounded-full bg-secondary/3 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-fine opacity-60" />
      </div>

      <div className="relative pt-24 pb-20 px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Back button */}
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

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left — Card display */}
            <div className="flex justify-center lg:justify-end lg:sticky lg:top-28 fade-in-up fade-in-up-delay-2">
              <CardDisplay imageUrl={previewUrl ?? undefined} cardName={fileName} />
            </div>

            {/* Right — Grade info */}
            <div className="space-y-6 fade-in-up fade-in-up-delay-3">

              {/* Card name + tags */}
              <div>
                <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-2">
                  Card Identified
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-700 text-foreground leading-tight">
                  Charizard Holo<br />1st Edition
                </h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
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
                      animation: "badge-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both"
                    }}
                  >
                    <Award className="h-8 w-8 flex-shrink-0" style={{ color: "hsl(var(--gold))" }} />
                    <div>
                      <p className="text-[0.65rem] font-600 text-muted-foreground uppercase tracking-widest mb-0.5">PSA Grade</p>
                      <p className="font-display text-3xl font-800 text-gradient-gold leading-none">PSA 8</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl border border-border bg-card/60 px-4 py-2.5">
                    <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Condition</p>
                    <p className="text-sm font-700 text-gradient-teal">Near Mint</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 px-4 py-2.5">
                    <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Avg Score</p>
                    <p className="text-sm font-700 text-foreground">{overallScore} / 10</p>
                  </div>
                </div>
              </div>

              {/* Grade breakdown */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-700 text-foreground">Grade Breakdown</h3>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info size={14} />
                  </button>
                </div>
                {gradeBreakdown.map((item) => (
                  <GradeBar key={item.label} label={item.label} score={item.score} />
                ))}
              </div>

              {/* Confidence indicator */}
              <div className="flex items-center gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <p className="text-xs text-secondary font-500">AI Confidence: 94.7% — High certainty grade</p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-1">
                {/* 🚧 Mint — wired up once friend adds mintGradeNft instruction to the contract */}
                <Button
                  size="lg"
                  className="w-full rounded-xl py-6 text-base font-600 relative overflow-hidden group"
                  style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  <Sparkles className="mr-2 h-5 w-5" />
                  Mint as NFT on Solana
                </Button>

                {/* 🚧 List — wired up once listCard instruction exists */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/marketplace")}
                  className="w-full rounded-xl py-6 text-base font-600 border-secondary/35 text-secondary hover:bg-secondary/8 hover:border-secondary/55 transition-all duration-300"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  List on Marketplace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
