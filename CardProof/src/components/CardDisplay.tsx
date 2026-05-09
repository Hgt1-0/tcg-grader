import React from "react";
import { ImageIcon } from "lucide-react";

interface CardDisplayProps {
  imageUrl?: string;
  cardName?: string;
}

/**
 * CardDisplay — Placeholder component for the card image on the result page.
 * This will be replaced with a 3D component later.
 */
const CardDisplay: React.FC<CardDisplayProps> = ({
  imageUrl,
  cardName = "Trading Card",
}) => {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ perspective: "800px" }}>
      {/* Ambient glow layers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="h-[360px] w-[260px] rounded-[20px] blur-[60px] opacity-30"
          style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
        />
      </div>
      <div
        className="absolute h-[420px] w-[300px] rounded-[24px] blur-[100px] opacity-10 animate-[float-slow_6s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(ellipse, hsl(252 68% 68%), transparent 70%)" }}
      />

      {/* Card container with float animation */}
      <div
        className="relative animate-[float_6s_ease-in-out_infinite]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Outer frame — premium border effect */}
        <div className="relative rounded-[22px] p-[2px]"
          style={{
            background: "linear-gradient(135deg, hsl(252 68% 68% / 0.8) 0%, hsl(270 65% 60% / 0.3) 40%, hsl(163 72% 40% / 0.5) 100%)",
            boxShadow: "0 30px 80px hsl(0 0% 0% / 0.6), 0 0 60px hsl(252 68% 68% / 0.2)"
          }}
        >
          {/* Card body */}
          <div className="rounded-[20px] overflow-hidden bg-[hsl(240_10%_8%)]" style={{ width: 300, height: 420 }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={cardName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 relative">
                {/* Subtle inner texture */}
                <div className="absolute inset-0 bg-grid-fine opacity-40" />
                <div className="absolute inset-0"
                  style={{
                    background: "radial-gradient(ellipse at 50% 30%, hsl(252 68% 68% / 0.06) 0%, transparent 70%)"
                  }}
                />

                {/* Card art placeholder */}
                <div className="relative z-10 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, hsl(252 68% 68% / 0.15), hsl(270 65% 60% / 0.1))" }}
                  >
                    <ImageIcon className="h-9 w-9 text-primary/50" />
                  </div>
                  <p className="text-sm font-500 text-muted-foreground/80">Card Preview</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">AI Analysis Complete</p>
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-4 left-4 h-8 w-8 rounded-tl-lg border-t-2 border-l-2 border-primary/30" />
                <div className="absolute top-4 right-4 h-8 w-8 rounded-tr-lg border-t-2 border-r-2 border-primary/30" />
                <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary/30" />
                <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-primary/30" />
              </div>
            )}
          </div>
        </div>

        {/* Reflection/shadow beneath */}
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-4 top-full h-10 w-[220px] blur-[20px] opacity-30 rounded-full"
          style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(163 72% 40%))" }}
        />
      </div>
    </div>
  );
};

export default CardDisplay;
