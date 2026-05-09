import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, TrendingUp, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import MarketplaceCard from "@/components/MarketplaceCard";

const categories = ["All Cards", "Pokemon", "MTG", "Sports", "FIFA"];

const listings = [
  {
    name: "Charizard Holo 1st Edition",
    grade: "PSA 9",
    price: "12.5",
    category: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    seller: "7xKp...3Fqr",
    mintedAt: "2025-03-18",
  },
  {
    name: "Black Lotus Alpha",
    grade: "PSA 7",
    price: "85.0",
    category: "MTG",
    imageUrl: "/cards/black_lotus.png",
    seller: "3mRt...9Ykz",
    mintedAt: "2025-04-02",
  },
  {
    name: "Pikachu Illustrator",
    grade: "PSA 10",
    price: "150.0",
    category: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/basep/1_hires.png",
    seller: "9nWq...2Lpx",
    mintedAt: "2025-02-27",
  },
  {
    name: "Michael Jordan Rookie",
    grade: "PSA 8",
    price: "24.3",
    category: "Sports",
    imageUrl: "https://storage.googleapis.com/images.pricecharting.com/corr5lxsleonni2ajjxn/1600.jpg",
    seller: "5vBj...8Dmn",
    mintedAt: "2025-04-15",
  },
  {
    name: "Blastoise Shadowless",
    grade: "PSA 8",
    price: "8.7",
    category: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    seller: "1cAh...6Srv",
    mintedAt: "2025-03-30",
  },
  {
    name: "Mox Sapphire Beta",
    grade: "PSA 6",
    price: "45.0",
    category: "MTG",
    imageUrl: "/cards/mox_sapphire.png",
    seller: "4pGs...7Tnv",
    mintedAt: "2025-04-08",
  },
  {
    name: "LeBron James Rookie",
    grade: "PSA 9",
    price: "38.0",
    category: "Sports",
    imageUrl: "/cards/lebron.png",
    seller: "3xAb...7Hcq",
    mintedAt: "2025-03-10",
  },
  {
    name: "Kobe Bryant #24",
    grade: "PSA 10",
    price: "55.0",
    category: "Sports",
    imageUrl: "/cards/kobe.png",
    seller: "7yPn...2Wks",
    mintedAt: "2025-02-14",
  },
  {
    name: "Stephen Curry Splash",
    grade: "PSA 8",
    price: "19.5",
    category: "Sports",
    imageUrl: "/cards/curry.png",
    seller: "5mZr...9Flj",
    mintedAt: "2025-04-19",
  },
  {
    name: "Cristiano Ronaldo CR7",
    grade: "PSA 10",
    price: "32.0",
    category: "FIFA",
    imageUrl: "/cards/ronaldo.png",
    seller: "2rCd...5Wzp",
    mintedAt: "2025-05-01",
  },
  {
    name: "Kylian Mbappe Gold",
    grade: "PSA 9",
    price: "18.5",
    category: "FIFA",
    imageUrl: "/cards/mbappe.png",
    seller: "6kFm...1Jqt",
    mintedAt: "2025-04-22",
  },
  {
    name: "Lionel Messi GOAT Edition",
    grade: "PSA 9",
    price: "27.0",
    category: "FIFA",
    imageUrl: "/cards/messi.png",
    seller: "8aLs...4Vbn",
    mintedAt: "2025-04-28",
  },
];

const sortOptions = ["Recent", "Price: Low", "Price: High", "Grade"];

const Marketplace: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All Cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Recent");

  const filteredListings = useMemo(() => {
    let results = activeFilter === "All Cards"
      ? listings
      : listings.filter((l) => l.category === activeFilter);

    if (searchQuery.trim()) {
      results = results.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "Price: Low") results = [...results].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === "Price: High") results = [...results].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === "Grade") results = [...results].sort((a, b) => {
      const ga = parseInt(a.grade.replace(/\D/g, ""));
      const gb = parseInt(b.grade.replace(/\D/g, ""));
      return gb - ga;
    });

    return results;
  }, [activeFilter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      {/* Background ambient */}
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
                <p className="mt-1.5 text-sm text-muted-foreground">Discover AI-verified trading card NFTs</p>
              </div>
              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                  <span>{listings.length} listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>Live floor: 8.7 SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="mb-8 fade-in-up fade-in-up-delay-1">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Category pills */}
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

              {/* Right controls */}
              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cards..."
                    className="w-full sm:w-56 rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>

                {/* Sort */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
    </div>
  );
};

export default Marketplace;
