import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, TrendingUp, Zap, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MarketplaceCard from "@/components/MarketplaceCard";
import ListCardModal from "@/components/ListCardModal";
import { useProgram } from "@/lib/useProgram";
import { fetchAllListings, lamportsToSol } from "@/lib/blockchain";

const categories = ["All Cards", "Base Set", "Fossil", "Neo Genesis", "Promo"];

// ── Pokemon card demo listings ────────────────────────────────────────────────
const demoListings = [
  {
    name: "Charizard Holo",
    grade: "PSA 9",
    price: "120.0",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    seller: "7xKp...3Fqr",
    mintedAt: "2025-03-18",
  },
  {
    name: "Blastoise Holo",
    grade: "PSA 8",
    price: "45.0",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    seller: "1cAh...6Srv",
    mintedAt: "2025-03-30",
  },
  {
    name: "Venusaur Holo",
    grade: "PSA 7",
    price: "32.0",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    seller: "4pGs...7Tnv",
    mintedAt: "2025-04-08",
  },
  {
    name: "Mewtwo Holo",
    grade: "PSA 9",
    price: "55.0",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/10_hires.png",
    seller: "9nWq...2Lpx",
    mintedAt: "2025-02-27",
  },
  {
    name: "Raichu Holo",
    grade: "PSA 8",
    price: "28.0",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/14_hires.png",
    seller: "3mRt...9Ykz",
    mintedAt: "2025-04-02",
  },
  {
    name: "Gyarados Holo",
    grade: "PSA 8",
    price: "22.5",
    category: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/6_hires.png",
    seller: "5vBj...8Dmn",
    mintedAt: "2025-04-15",
  },
  {
    name: "Gengar Holo",
    grade: "PSA 9",
    price: "38.0",
    category: "Fossil",
    imageUrl: "https://images.pokemontcg.io/fossil/5_hires.png",
    seller: "3xAb...7Hcq",
    mintedAt: "2025-03-10",
  },
  {
    name: "Lapras Holo",
    grade: "PSA 8",
    price: "18.0",
    category: "Fossil",
    imageUrl: "https://images.pokemontcg.io/fossil/10_hires.png",
    seller: "7yPn...2Wks",
    mintedAt: "2025-02-14",
  },
  {
    name: "Dragonite Holo",
    grade: "PSA 7",
    price: "24.0",
    category: "Fossil",
    imageUrl: "https://images.pokemontcg.io/fossil/4_hires.png",
    seller: "5mZr...9Flj",
    mintedAt: "2025-04-19",
  },
  {
    name: "Lugia Holo",
    grade: "PSA 10",
    price: "200.0",
    category: "Neo Genesis",
    imageUrl: "https://images.pokemontcg.io/neo1/9_hires.png",
    seller: "2rCd...5Wzp",
    mintedAt: "2025-05-01",
  },
  {
    name: "Typhlosion Holo",
    grade: "PSA 9",
    price: "42.0",
    category: "Neo Genesis",
    imageUrl: "https://images.pokemontcg.io/neo1/18_hires.png",
    seller: "6kFm...1Jqt",
    mintedAt: "2025-04-22",
  },
  {
    name: "Pikachu Illustrator",
    grade: "PSA 10",
    price: "500.0",
    category: "Promo",
    imageUrl: "https://images.pokemontcg.io/basep/1_hires.png",
    seller: "8aLs...4Vbn",
    mintedAt: "2025-04-28",
  },
];

type ListingItem = {
  name: string;
  grade: string;
  price: string;
  category: string;
  imageUrl?: string;
  seller?: string;
  mintedAt?: string;
  nftMint?: string;
  onChain?: boolean;
};

const sortOptions = ["Recent", "Price: Low", "Price: High", "Grade"];

const Marketplace: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All Cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Recent");
  const [chainListings, setChainListings] = useState<ListingItem[]>([]);
  const [loadingChain, setLoadingChain] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [prefillMint, setPrefillMint] = useState("");

  const location = useLocation();
  const { program } = useProgram();

  // Auto-open List modal if navigated here from mint result
  useEffect(() => {
    const routeState = location.state as { prefillMint?: string } | null;
    if (routeState?.prefillMint) {
      setPrefillMint(routeState.prefillMint);
      setListModalOpen(true);
    }
  }, [location.state]);

  // ── Fetch on-chain listings ──────────────────────────────────────────────
  const refreshChain = useCallback(() => {
    if (!program) return;
    setLoadingChain(true);
    fetchAllListings(program)
      .then((raw) => {
        const mapped: ListingItem[] = raw.map((l, idx) => ({
          name: "CardProof Certified Holo",
          grade: "PSA 10",
          price: lamportsToSol(l.account.price),
          category: "Promo",
          imageUrl: demoListings[idx % demoListings.length].imageUrl, // Steal a cool image for the demo
          seller: l.account.seller.toBase58().slice(0, 6) + "..." + l.account.seller.toBase58().slice(-4),
          mintedAt: new Date().toISOString().slice(0, 10),
          nftMint: l.account.mint.toBase58(),
          onChain: true,
        }));
        setChainListings(mapped);
      })
      .catch(console.error)
      .finally(() => setLoadingChain(false));
  }, [program]);

  useEffect(() => { refreshChain(); }, [refreshChain]);

  const allListings = useMemo((): ListingItem[] => {
    return [...demoListings, ...chainListings];
  }, [chainListings]);

  const filteredListings = useMemo(() => {
    let results = activeFilter === "All Cards"
      ? allListings
      : allListings.filter((l) => l.category === activeFilter);

    if (searchQuery.trim()) {
      results = results.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "Price: Low")  results = [...results].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === "Price: High") results = [...results].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === "Grade") results = [...results].sort((a, b) => {
      const ga = parseInt(a.grade.replace(/\D/g, "")) || 0;
      const gb = parseInt(b.grade.replace(/\D/g, "")) || 0;
      return gb - ga;
    });

    return results;
  }, [activeFilter, searchQuery, sortBy, allListings]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 h-[500px] w-[600px] rounded-full bg-secondary/3 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[500px] rounded-full bg-primary/3 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-fine opacity-60" />
      </div>

      <div className="relative pt-24 pb-20 px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-10 fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-8 rounded-full bg-secondary" />
              <span className="text-xs font-600 text-secondary uppercase tracking-widest">Live Marketplace</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-700 text-foreground">Marketplace</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">AI-verified Pokémon card NFTs on Solana</p>
              </div>
              <Button
                onClick={() => setListModalOpen(true)}
                className="rounded-xl px-5 py-2.5 text-sm font-600 flex items-center gap-2 relative overflow-hidden group/lst"
                style={{ background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))" }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover/lst:bg-white/10 transition-colors" />
                <Plus className="h-4 w-4" />
                List Card
              </Button>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                  <span>{filteredListings.length} listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  {loadingChain
                    ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />syncing chain…</span>
                    : <span>{chainListings.length > 0 ? `${chainListings.length} on-chain` : "Floor: 18.0 SOL"}</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="mb-8 fade-in-up fade-in-up-delay-1">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`rounded-xl px-4 py-2 text-sm font-500 transition-all duration-200 ${
                      activeFilter === cat
                        ? "text-primary-foreground shadow-[var(--shadow-glow-purple-sm)]"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                    style={activeFilter === cat ? {
                      background: "linear-gradient(135deg, hsl(252 68% 68%), hsl(270 65% 60%))"
                    } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Pokémon cards..."
                    className="w-full sm:w-56 rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>

                <div className="relative">
                  <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-xl border border-border bg-card py-2.5 pl-8 pr-4 text-sm text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    {sortOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredListings.map((card, index) => (
                <MarketplaceCard
                  key={`${card.name}-${index}`}
                  name={card.name}
                  grade={card.grade}
                  price={card.price}
                  category={card.category}
                  imageUrl={card.imageUrl}
                  seller={card.seller}
                  mintedAt={card.mintedAt}
                  nftMint={card.nftMint}
                  onChain={card.onChain}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center fade-in-up">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-600 text-foreground">No cards found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      <ListCardModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        onListed={refreshChain}
        prefillMint={prefillMint}
      />
    </div>
  );
};

export default Marketplace;
