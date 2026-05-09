import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Heart } from "lucide-react";

interface MarketplaceCardProps {
  name: string;
  grade: string;
  price: string;
  imageUrl?: string;
  category: string;
  index?: number;
}

const categoryColors: Record<string, { text: string; bg: string; dot: string }> = {
  Pokemon: { text: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
  MTG: { text: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400" },
  Sports: { text: "text-orange-400", bg: "bg-orange-400/10", dot: "bg-orange-400" },
};

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  name, grade, price, imageUrl, category, index = 0
}) => {
  const [liked, setLiked] = useState(false);
  const cat = categoryColors[category] || { text: "text-muted-foreground", bg: "bg-muted/50", dot: "bg-muted-foreground" };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-350 glow-purple-hover fade-in-up`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Image area */}
      <div className="relative overflow-hidden bg-surface" style={{ aspectRatio: "3/4" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center relative">
            <div className="absolute inset-0 bg-grid-fine opacity-50" />
            <div className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(252 68% 68% / 0.05), transparent 70%)" }}
            />
            <div className="relative text-center z-10">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg, hsl(252 68% 68% / 0.12), hsl(270 65% 60% / 0.08))" }}
              >
                <ImageIcon className="h-6 w-6 text-primary/50" />
              </div>
              <p className="text-xs text-muted-foreground/60">{category}</p>
            </div>
            {/* Decorative corners */}
            <div className="absolute top-3 left-3 h-5 w-5 rounded-tl-md border-t border-l border-primary/20" />
            <div className="absolute top-3 right-3 h-5 w-5 rounded-tr-md border-t border-r border-primary/20" />
            <div className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-md border-b border-l border-primary/20" />
            <div className="absolute bottom-3 right-3 h-5 w-5 rounded-br-md border-b border-r border-primary/20" />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Grade badge */}
        <div className="absolute top-3 left-3 rounded-lg backdrop-blur-md px-2.5 py-1"
          style={{ background: "hsl(240 10% 7% / 0.85)", border: "1px solid hsl(43 96% 58% / 0.3)" }}
        >
          <span className="text-xs font-700 text-gradient-gold">{grade}</span>
        </div>

        {/* Like button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 ${
            liked ? "bg-red-500/20 border border-red-500/40" : "bg-background/60 border border-border/50 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${liked ? "text-red-400 fill-red-400" : "text-muted-foreground"}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
            <span className={`text-xs font-500 ${cat.text}`}>{category}</span>
          </div>
          <h3 className="font-display text-sm font-700 text-foreground truncate group-hover:text-primary transition-colors duration-200">
            {name}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div>
            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Price</p>
            <p className="font-display text-base font-700 text-foreground">{price} <span className="text-xs font-500 text-muted-foreground">SOL</span></p>
          </div>
          <Button
            size="sm"
            className="rounded-xl text-xs font-600 px-4 relative overflow-hidden group/btn"
            style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/15 transition-colors" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCard;
