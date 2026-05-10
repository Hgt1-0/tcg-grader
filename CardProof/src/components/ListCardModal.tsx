import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Wallet, Tag } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/useProgram";
import { listNft } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";

interface ListCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListed?: () => void;
  prefillMint?: string; // auto-filled from mint result page
}

const ListCardModal: React.FC<ListCardModalProps> = ({ open, onOpenChange, onListed, prefillMint }) => {
  const [mintAddress, setMintAddress] = useState(prefillMint ?? "");
  const [priceSOL, setPriceSOL] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { program, wallet, connection } = useProgram();
  const { toast } = useToast();

  const handleList = async () => {
    if (!publicKey) { setVisible(true); return; }
    if (!mintAddress.trim() || !priceSOL.trim()) {
      toast({ title: "Missing fields", description: "Enter the NFT mint address and price.", variant: "destructive" });
      return;
    }

    let mint: PublicKey;
    try {
      mint = new PublicKey(mintAddress.trim());
    } catch {
      toast({ title: "Invalid mint address", description: "Make sure it's a valid Solana public key.", variant: "destructive" });
      return;
    }

    const price = parseFloat(priceSOL);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid price", description: "Enter a valid SOL amount.", variant: "destructive" });
      return;
    }

    if (!program || !wallet.publicKey) {
      toast({ title: "Wallet not ready", description: "Connect your wallet first.", variant: "destructive" });
      return;
    }

    setStatus("loading");
    try {
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const sellerAta = await getAssociatedTokenAddress(mint, wallet.publicKey);

      if (!signTransaction) throw new Error("Wallet does not support signTransaction");

      const { sig, escrowPubkey } = await listNft(
        program,
        wallet.publicKey,
        mint,
        sellerAta,
        price,
        signTransaction,
        connection
      );

      // Persist escrow pubkey locally so buy/delist can reference it
      const stored = JSON.parse(localStorage.getItem("cardproof_escrows") ?? "{}");
      stored[mint.toBase58()] = escrowPubkey;
      localStorage.setItem("cardproof_escrows", JSON.stringify(stored));

      setStatus("done");
      toast({
        title: "Card Listed! 🎉",
        description: `Tx: ${sig.slice(0, 16)}… Escrow: ${escrowPubkey.slice(0, 8)}…`,
      });
      onListed?.();
    } catch (err: any) {
      setStatus("idle");
      toast({ title: "Listing failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  // Sync prefillMint when it changes (e.g. modal opens with a new address)
  useEffect(() => {
    if (prefillMint) setMintAddress(prefillMint);
  }, [prefillMint, open]);

  const handleClose = (v: boolean) => {
    if (!v) { setStatus("idle"); setMintAddress(""); setPriceSOL(""); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border border-border bg-background p-0 overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(252 68% 68%), hsl(163 72% 40%))" }} />

        <div className="p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-display text-xl font-700 text-foreground flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              List Your Card
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Escrow your NFT on-chain and set a price in SOL.
            </p>
          </DialogHeader>

          {status === "done" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-secondary" />
              <p className="font-display text-lg font-700 text-foreground">Card Listed!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your NFT is now live on the marketplace.
              </p>
              <Button
                className="mt-2 rounded-xl"
                onClick={() => handleClose(false)}
                style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mint address */}
              <div>
                <label className="text-xs font-600 text-muted-foreground uppercase tracking-wide block mb-1.5">
                  NFT Mint Address
                </label>
                <input
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="e.g. 7xKpAB...3Fqr"
                  disabled={status === "loading"}
                  className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors font-mono disabled:opacity-50"
                />
                <p className="text-[0.65rem] text-muted-foreground mt-1">
                  The mint address of the NFT in your wallet you want to sell.
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-600 text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Price (SOL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={priceSOL}
                    onChange={(e) => setPriceSOL(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.1"
                    disabled={status === "loading"}
                    className="w-full rounded-xl border border-border bg-card py-2.5 pl-4 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-600">SOL</span>
                </div>
                {priceSOL && !isNaN(parseFloat(priceSOL)) && (
                  <p className="text-[0.65rem] text-muted-foreground mt-1">
                    ≈ ${(parseFloat(priceSOL) * 145).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                  </p>
                )}
              </div>

              {/* Info box */}
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p>• Your NFT will be transferred to a program-owned escrow account</p>
                <p>• Buyers pay SOL directly to your wallet on purchase</p>
                <p>• You can delist at any time to reclaim your card</p>
              </div>

              <Button
                size="lg"
                onClick={handleList}
                disabled={status === "loading"}
                className="w-full rounded-xl py-5 text-base font-600 relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                {status === "loading" ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Listing…</>
                ) : !publicKey ? (
                  <><Wallet className="mr-2 h-5 w-5" />Connect Wallet to List</>
                ) : (
                  <><Tag className="mr-2 h-5 w-5" />List on Marketplace</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListCardModal;
