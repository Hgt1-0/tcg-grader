/**
 * blockchain.ts — Helpers for interacting with the tcg_marketplace program.
 *
 * Currently only `initialize` exists on-chain.
 * When your friend adds mint/list/buy instructions, add the corresponding
 * functions here and import them into the pages.
 */

import { Program, web3 } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import type { TcgMarketplace } from "./idl/types";
import { PROGRAM_ID } from "./useProgram";

// ─── Initialize ───────────────────────────────────────────────────────────────

/**
 * Calls the `initialize` instruction on the deployed program.
 * Returns the transaction signature.
 */
export async function initialize(
  program: Program<TcgMarketplace>
): Promise<string> {
  const sig = await (program.methods as any)
    .initialize()
    .accounts({})
    .rpc();
  return sig;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Converts SOL → lamports. */
export function solToLamports(sol: number): number {
  return Math.floor(sol * web3.LAMPORTS_PER_SOL);
}

/** Converts lamports → SOL string (2dp). */
export function lamportsToSol(lamports: number): string {
  return (lamports / web3.LAMPORTS_PER_SOL).toFixed(2);
}

// ─── 🚧 Coming soon (pending friend's contract additions) ─────────────────────
// mintGradeNft()  — stores AI grade on-chain as a verified record
// listCard()      — lists a graded card on the marketplace
// buyCard()       — transfers SOL buyer → seller and transfers ownership
// delistCard()    — removes an active listing
//
// Add these here once the IDL is updated with those instructions.
