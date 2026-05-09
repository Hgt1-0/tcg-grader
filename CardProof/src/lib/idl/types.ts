/**
 * TypeScript types for the tcg_marketplace Anchor program.
 * Program ID: 9hFDdjtxZPGe3fnA2wbpAZwXDmqjLYFFhjVXsv1obv1W
 * Generated from: blockchain/programs/tcg_marketplace/src/lib.rs
 */

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// ─── On-chain account ─────────────────────────────────────────────────────────

/** PDA: seeds = ["listing", nft_mint] — created when seller lists a card */
export interface Listing {
  seller: PublicKey;
  mint:   PublicKey;
  price:  BN;       // lamports
  bump:   number;
}

// ─── Anchor program type ──────────────────────────────────────────────────────

export type TcgMarketplace = {
  address: "9hFDdjtxZPGe3fnA2wbpAZwXDmqjLYFFhjVXsv1obv1W";
  metadata: {
    name: "tcg_marketplace";
    version: "0.1.0";
    spec: "0.1.0";
  };
  accounts: [{ name: "listing"; type: Listing }];
  instructions: [
    {
      name: "list";
      args: [{ name: "price"; type: "u64" }];
    },
    { name: "buy";    args: [] },
    { name: "delist"; args: [] }
  ];
};
