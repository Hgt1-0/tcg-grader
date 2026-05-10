import React, { useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Sparkles, Shield, Coins, Zap, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const featureSteps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Card",
    description: "Upload both front and back of your trading card. We support PSA, BGS, CGC grading references.",
    color: "purple",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "AI Grades It",
    description: "Our vision model analyzes centering, corners, edges, and surface condition in seconds.",
    color: "teal",
  },
  {
    icon: Coins,
    step: "03",
    title: "Mint as NFT",
    description: "Mint your verified grade as a tamper-proof NFT on Solana. List on our marketplace instantly.",
    color: "gold",
  },
];

const stats = [
  { label: "Cards Graded", value: "84,291" },
  { label: "NFTs Minted", value: "12,047" },
  { label: "Total Volume", value: "₀4,831 SOL" },
  { label: "Avg Grade", value: "PSA 7.4" },
];

interface CardSide {
  file: File | null;
  previewUrl: string | null;
  fileName: string | null;
}

const emptyCardSide = (): CardSide => ({ file: null, previewUrl: null, fileName: null });

const UploadZone: React.FC<{
  label: string;
  side: CardSide;
  onFile: (file: File) => void;
  onClear: () => void;
}> = ({ label, side, onFile, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div className="flex-1">
      <p className="text-xs font-600 text-muted-foreground uppercase tracking-widest mb-3 text-center">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        className={`group relative cursor-pointer rounded-2xl transition-all duration-300 ${isDragging ? "scale-[1.02]" : ""}`}
      >
        {/* Border gradient */}
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${isDragging || side.previewUrl ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          style={{ background: "linear-gradient(135deg, hsl(252 68% 68% / 0.5), transparent 40%, hsl(163 72% 40% / 0.4))", padding: "1px" }}
        />
        <div className="absolute inset-[1px] rounded-2xl bg-background" />

        <div className={`relative rounded-[14px] border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isDragging ? "border-primary/70 bg-primary/5" : side.previewUrl ? "border-primary/40 bg-card/80" : "border-border hover:border-primary/40 bg-card/60"
        }`} style={{ minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {side.previewUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img src={side.previewUrl} alt={label} className="h-28 w-20 object-cover rounded-xl shadow-lg" />
                <div className="absolute inset-0 rounded-xl ring-2 ring-primary/40" />
              </div>
              <div>
                <p className="text-xs font-600 text-foreground truncate max-w-[140px]">{side.fileName}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Click to replace</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-destructive transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-500 text-foreground">Drop or <span className="text-primary underline decoration-primary/30 underline-offset-2">click to upload</span></p>
              <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG, WEBP · Up to 10MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [front, setFront] = useState<CardSide>(emptyCardSide());
  const [back,  setBack]  = useState<CardSide>(emptyCardSide());

  const handleFile = (setter: typeof setFront) => (file: File) => {
    setter({ file, fileName: file.name, previewUrl: URL.createObjectURL(file) });
  };

  const bothUploaded = !!(front.file && back.file);

  const handleGrade = () => {
    if (!bothUploaded) return;
    navigate("/result", {
      state: {
        frontFile: front.file,
        backFile:  back.file,
        previewUrl: front.previewUrl,
        fileName: front.fileName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/4 blur-[120px]" />
        <div className="absolute top-1/3 left-0 h-[400px] w-[500px] rounded-full bg-secondary/3 blur-[100px]" />
        <div className="absolute top-1/2 right-0 h-[300px] w-[400px] rounded-full bg-purple-600/3 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-fine opacity-100" />
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-16 px-5 sm:px-8">
        <div className="relative mx-auto max-w-5xl">

          {/* Badge */}
          <div className="mb-8 flex justify-center fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">Powered by Solana · AI-verified grading</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center fade-in-up fade-in-up-delay-1">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-800 tracking-tight leading-[1.05]">
              <span className="text-foreground block">Grade Your Cards.</span>
              <span className="text-gradient-primary block mt-1">Prove Their Worth.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed font-300">
              Upload both sides of your trading card. Our AI grades it <em className="not-italic font-500 text-foreground/80">instantly</em>.
              Mint it as a verified NFT on Solana.
            </p>
          </div>

          {/* 3D Interactive Card */}
          <div className="w-full h-[500px] mt-12 mb-8 relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black/20 fade-in-up fade-in-up-delay-2 pointer-events-auto">
            <iframe src="/3dcard.html" className="w-full h-full border-0 pointer-events-auto" title="3D Pokemon Card" />
          </div>

          {/* CTA hints */}
          <div className="flex justify-center gap-3 mt-8 fade-in-up fade-in-up-delay-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
              <span>Grade in under 10 seconds</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
              <span>Free to try</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upload zone */}
      <section className="relative px-5 sm:px-8 pb-20">
        <div className="mx-auto max-w-2xl fade-in-up fade-in-up-delay-3">

          {/* Two-sided upload */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <UploadZone
              label="Front of Card"
              side={front}
              onFile={handleFile(setFront)}
              onClear={() => setFront(emptyCardSide())}
            />
            <UploadZone
              label="Back of Card"
              side={back}
              onFile={handleFile(setBack)}
              onClear={() => setBack(emptyCardSide())}
            />
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-6 text-xs text-muted-foreground">
            <div className={`flex items-center gap-1.5 ${front.file ? "text-secondary" : ""}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${front.file ? "bg-secondary" : "bg-muted-foreground/40"}`} />
              Front {front.file ? "✓" : "needed"}
            </div>
            <div className="h-px w-6 bg-border" />
            <div className={`flex items-center gap-1.5 ${back.file ? "text-secondary" : ""}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${back.file ? "bg-secondary" : "bg-muted-foreground/40"}`} />
              Back {back.file ? "✓" : "needed"}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleGrade}
              disabled={!bothUploaded}
              size="lg"
              className="group relative rounded-full px-10 py-6 text-base font-600 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
              style={bothUploaded ? { background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" } : {}}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              <Sparkles className="mr-2 h-5 w-5" />
              {bothUploaded ? "Grade My Card" : "Upload Both Sides First"}
              {bothUploaded && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative px-5 sm:px-8 pb-16 fade-in-up fade-in-up-delay-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border/60 bg-card/40 glass p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x-0 md:divide-x divide-border/40">
              {stats.map((stat, i) => (
                <div key={i} className="text-center md:px-6 first:pl-0 last:pr-0">
                  <p className="font-display text-2xl font-700 text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature steps */}
      <section className="relative px-5 sm:px-8 pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-700 text-foreground">How It Works</h2>
            <p className="mt-2 text-sm text-muted-foreground">Three steps from card to verified NFT</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/10" />

            {featureSteps.map((feature, i) => (
              <div
                key={feature.step}
                className={`group relative rounded-2xl border border-border bg-card p-6 transition-all duration-350 glow-purple-hover fade-in-up fade-in-up-delay-${i + 3}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300 ${
                    feature.color === 'purple' ? 'bg-primary/10 group-hover:bg-primary/20' :
                    feature.color === 'teal' ? 'bg-secondary/10 group-hover:bg-secondary/20' :
                    'bg-gold/10 group-hover:bg-gold/20'
                  }`}>
                    <feature.icon className={`h-5 w-5 ${
                      feature.color === 'purple' ? 'text-primary' :
                      feature.color === 'teal' ? 'text-secondary' :
                      'text-gold'
                    }`} />
                  </div>
                  <span className="font-display text-3xl font-800 text-muted-foreground/20 leading-none">{feature.step}</span>
                </div>
                <h3 className="font-display text-lg font-700 text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-5 relative">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground">CardProof — AI-powered grading on Solana</p>
          </div>
          <div className="flex items-center gap-6">
            {["Terms", "Privacy", "Docs", "Discord"].map(link => (
              <a key={link} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
