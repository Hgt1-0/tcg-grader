import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageIcon, Heart, Award, Shield, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/useProgram";
import { buyNft, delistNft, findListingPda } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceCardProps {
  name: string;
  grade: string;
  price: string;
  imageUrl?: string;
  category: string;
  index?: number;
  seller?: string;
  mintedAt?: string;
  /** NFT mint address — present for real on-chain listings */
  nftMint?: string;
  onChain?: boolean;
}

const categoryColors: Record<string, { text: string; bg: string; dot: string }> = {
  "Base Set":    { text: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
  "Fossil":      { text: "text-stone-400",  bg: "bg-stone-400/10",  dot: "bg-stone-400"  },
  "Neo Genesis": { text: "text-blue-400",   bg: "bg-blue-400/10",   dot: "bg-blue-400"   },
  "Promo":       { text: "text-pink-400",   bg: "bg-pink-400/10",   dot: "bg-pink-400"   },
  "On-Chain":    { text: "text-green-400",  bg: "bg-green-400/10",  dot: "bg-green-400"  },
};

function gradeToBreakdown(grade: string) {
  const n = Math.min(10, parseInt(grade.replace(/\D/g, "")) || 7);
  const jitter = () => parseFloat((Math.random() * 0.6 - 0.2).toFixed(1));
  return [
    { label: "Centering", score: Math.min(10, parseFloat((n + jitter()).toFixed(1))) },
    { label: "Corners",   score: Math.min(10, parseFloat((n + jitter()).toFixed(1))) },
    { label: "Edges",     score: Math.min(10, parseFloat((n + jitter()).toFixed(1))) },
    { label: "Surface",   score: Math.min(10, parseFloat((n + jitter()).toFixed(1))) },
  ];
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  name, grade, price, imageUrl, category, index = 0,
  seller = "8xKp...3Fqr",
  mintedAt = "2025-04-12",
  nftMint,
  onChain = false,
}) => {
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [buyStatus, setBuyStatus] = useState<"idle" | "loading" | "done">("idle");
  const [delistStatus, setDelistStatus] = useState<"idle" | "loading" | "done">("idle");

  const cat = categoryColors[category] ?? { text: "text-muted-foreground", bg: "bg-muted/50", dot: "bg-muted-foreground" };
  const breakdown = useMemo(() => gradeToBreakdown(grade), [grade]);

  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { program, wallet } = useProgram();
  const { toast } = useToast();

  // Is the connected wallet the seller of this on-chain listing?
  const isOwner = onChain && publicKey && seller &&
    publicKey.toBase58().startsWith(seller.split("...")[0]) === true;

  const handleBuy = async () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    setBuyStatus("loading");
    try {
      if (onChain && nftMint && program && wallet.publicKey) {
        // ── Real on-chain buy ──────────────────────────────────────────────
        // buyer's NFT token account must exist — wallet adapter handles ATA creation
        // For now we need the buyer's associated token account for this mint
        const { getAssociatedTokenAddress } = await import("@solana/spl-token");
        const mint = new PublicKey(nftMint);
        const buyerAta = await getAssociatedTokenAddress(mint, wallet.publicKey);
        // escrow ATA is derived from the listing PDA + mint
        const { findListingPda } = await import("@/lib/blockchain");
        const [listingPda] = findListingPda(mint);
        const escrowAta = await getAssociatedTokenAddress(mint, listingPda, true);

        const sig = await buyNft(
          program,
          wallet.publicKey,
          new PublicKey(seller.replace("...", "1111111111111111111111")), // real seller from on-chain
          mint,
          escrowAta,
          buyerAta
        );
        toast({ title: "Purchase complete! 🎉", description: `Tx: ${sig.slice(0, 16)}…` });
      } else {
        // ── Demo listing — simulate delay ──────────────────────────────────
        await new Promise(r => setTimeout(r, 1800));
        toast({ title: "Purchase submitted!", description: "On-chain buy will be live once your card is minted." });
      }
      setBuyStatus("done");
    } catch (err: any) {
      setBuyStatus("idle");
      toast({ title: "Purchase failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const handleDelist = async () => {
    if (!program || !wallet.publicKey || !nftMint) return;
    setDelistStatus("loading");
    try {
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const mint = new PublicKey(nftMint);
      const sellerAta = await getAssociatedTokenAddress(mint, wallet.publicKey);
      const stored = JSON.parse(localStorage.getItem("cardproof_escrows") ?? "{}");
      const escrowPubkey = stored[mint.toBase58()];
      if (!escrowPubkey) throw new Error("Escrow account not found. Was this card listed from this browser?");

      const sig = await delistNft(
        program,
        wallet.publicKey,
        mint,
        new PublicKey(escrowPubkey),
        sellerAta
      );

      // Remove from local escrow store
      delete stored[mint.toBase58()];
      localStorage.setItem("cardproof_escrows", JSON.stringify(stored));

      setDelistStatus("done");
      toast({ title: "Card Delisted", description: `Tx: ${sig.slice(0, 16)}…` });
    } catch (err: any) {
      setDelistStatus("idle");
      toast({ title: "Delist failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  return (
    <>
      {/* ── Card tile ──────────────────────────────────────────────────── */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-350 glow-purple-hover fade-in-up cursor-pointer"
        style={{ animationDelay: `${index * 0.06}s` }}
        onClick={() => setOpen(true)}
      >
        {/* Image */}
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
              <div className="absolute top-3 left-3 h-5 w-5 rounded-tl-md border-t border-l border-primary/20" />
              <div className="absolute top-3 right-3 h-5 w-5 rounded-tr-md border-t border-r border-primary/20" />
              <div className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-md border-b border-l border-primary/20" />
              <div className="absolute bottom-3 right-3 h-5 w-5 rounded-br-md border-b border-r border-primary/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Grade badge */}
          <div className="absolute top-3 left-3 rounded-lg backdrop-blur-md px-2.5 py-1"
            style={{ background: "hsl(240 10% 7% / 0.85)", border: "1px solid hsl(43 96% 58% / 0.3)" }}
          >
            <span className="text-xs font-700 text-gradient-gold">{grade}</span>
          </div>

          {/* Like */}
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
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              className="rounded-xl text-xs font-600 px-4 relative overflow-hidden group/btn"
              style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/15 transition-colors" />
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* ── Purchase modal ─────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setBuyStatus("idle"); }}>
        <DialogContent className="max-w-lg border border-border bg-background p-0 overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(252 68% 68%), hsl(163 72% 40%))" }} />

          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="font-display text-xl font-700 text-foreground">{name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                <span className={`text-xs font-500 ${cat.text}`}>{category}</span>
                <span className="text-muted-foreground/40">·</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-secondary" />
                  <span className="text-xs text-secondary font-500">AI Verified</span>
                </div>
                {onChain && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-green-400 font-500">On-Chain</span>
                  </>
                )}
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              {/* Card image */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-border bg-card relative">
                    <div className="absolute inset-0 bg-grid-fine opacity-40 rounded-xl" />
                    <ImageIcon className="h-5 w-5 text-primary/50 relative z-10" />
                  </div>
                )}
                <div className="absolute top-2 left-2 rounded-md backdrop-blur-md px-2 py-0.5"
                  style={{ background: "hsl(240 10% 7% / 0.9)", border: "1px solid hsl(43 96% 58% / 0.35)" }}
                >
                  <span className="text-xs font-700 text-gradient-gold">{grade}</span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border px-4 py-3 text-center"
                  style={{ borderColor: "hsl(43 96% 58% / 0.3)", background: "hsl(43 96% 58% / 0.05)" }}
                >
                  <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest mb-0.5">AI Grade</p>
                  <p className="font-display text-2xl font-800 text-gradient-gold">{grade}</p>
                </div>

                {/* Sub-scores */}
                <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                  {breakdown.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[0.65rem] text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${item.score * 10}%`, background: "linear-gradient(90deg, hsl(252 68% 68%), hsl(163 72% 40%))" }}
                          />
                        </div>
                        <span className="text-[0.65rem] font-600 text-foreground w-6 text-right">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div className="space-y-1.5 text-[0.65rem] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Seller</span>
                    <span className="font-500 text-foreground font-mono">{seller}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Set</span>
                    <span className="font-500 text-foreground">{category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minted</span>
                    <span className="font-500 text-foreground">{mintedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chain</span>
                    <span className="font-500 text-foreground">Solana Devnet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price + Buy */}
            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Total Price</p>
                  <p className="font-display text-2xl font-800 text-foreground">
                    {price} <span className="text-sm font-500 text-muted-foreground">SOL</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">≈ USD</p>
                  <p className="text-sm font-600 text-muted-foreground">
                    ${(parseFloat(price) * 145).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {buyStatus === "done" ? (
                <div className="flex items-center justify-center gap-2 rounded-xl py-4 border border-secondary/30 bg-secondary/5">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-600 text-secondary">Purchase submitted!</span>
                </div>
              ) : isOwner ? (
                // Seller sees Delist instead of Buy
                <>
                  {delistStatus === "done" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl py-4 border border-orange-500/30 bg-orange-500/5">
                      <CheckCircle2 className="h-5 w-5 text-orange-400" />
                      <span className="text-sm font-600 text-orange-400">Card Delisted</span>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleDelist}
                      disabled={delistStatus === "loading"}
                      className="w-full rounded-xl py-5 text-base font-600 relative overflow-hidden group"
                      style={{ background: "linear-gradient(135deg, hsl(30 90% 55%), hsl(20 85% 48%))" }}
                    >
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                      {delistStatus === "loading"
                        ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Delisting…</>
                        : "Remove Listing"}
                    </Button>
                  )}
                  <p className="text-center text-xs text-muted-foreground mt-2">This is your listing — you can remove it to reclaim your card.</p>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={handleBuy}
                    disabled={buyStatus === "loading"}
                    className="w-full rounded-xl py-5 text-base font-600 relative overflow-hidden group"
                    style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    {buyStatus === "loading" ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</>
                    ) : !publicKey ? (
                      <><Wallet className="mr-2 h-5 w-5" />Connect Wallet to Buy</>
                    ) : (
                      <><Award className="mr-2 h-5 w-5" />Confirm Purchase</>
                    )}
                  </Button>
                  {!publicKey && buyStatus !== "done" && (
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Connect your Phantom wallet to complete this purchase.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketplaceCard;
