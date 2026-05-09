import React, { useEffect, useRef, useState } from "react";

interface GradeBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

const GradeBar: React.FC<GradeBarProps> = ({ label, score, maxScore = 10 }) => {
  const percentage = (score / maxScore) * 100;
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getGradient = () => {
    if (percentage >= 85) return "linear-gradient(90deg, hsl(163 72% 40%), hsl(180 70% 45%))";
    if (percentage >= 70) return "linear-gradient(90deg, hsl(252 68% 68%), hsl(270 65% 62%))";
    return "linear-gradient(90deg, hsl(0 84% 60%), hsl(20 90% 55%))";
  };

  const getScoreColor = () => {
    if (percentage >= 85) return "text-secondary";
    if (percentage >= 70) return "text-primary";
    return "text-destructive";
  };

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-500 text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-700 tabular-nums ${getScoreColor()}`}>{score}</span>
          <span className="text-xs text-muted-foreground/60">/{maxScore}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted relative">
        <div
          className="h-full rounded-full transition-all duration-[1000ms] ease-out relative"
          style={{
            width: animated ? `${percentage}%` : "0%",
            background: getGradient(),
          }}
        >
          <div className="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default GradeBar;
