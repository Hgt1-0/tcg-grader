/**
 * blockchain.ts — Wrappers for the tcg_marketplace on-chain instructions.
 *
 * Instructions available:
 *   list(price)  — escrows NFT, creates Listing PDA
 *   buy()        — transfers SOL to seller + NFT to buyer, closes listing
 *   delist()     — returns NFT to seller, closes listing
 */

import { Program, BN, web3 } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { TcgMarketplace, Listing } from "./idl/types";
import { PROGRAM_ID } from "./useProgram";

// ─── PDA ─────────────────────────────────────────────────────────────────────

/** Listing PDA: seeds = ["listing", nftMint] */
export function findListingPda(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), nftMint.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Instructions ─────────────────────────────────────────────────────────────

/**
 * Lists an NFT on the marketplace.
 * Generates a fresh escrow keypair, transfers NFT into program-owned escrow.
 *
 * Returns { sig, escrowPubkey } — store escrowPubkey to use during buy/delist.
 *
 * @param priceInSol  Price in SOL (converted to lamports internally)
 */
export async function listNft(
  program: Program<TcgMarketplace>,
  seller: PublicKey,
  nftMint: PublicKey,
  sellerNftTokenAccount: PublicKey,
  priceInSol: number
): Promise<{ sig: string; escrowPubkey: string }> {
  const [listing] = findListingPda(nftMint);
  const price = new BN(Math.floor(priceInSol * LAMPORTS_PER_SOL));

  // Fresh keypair for the escrow token account (initialized by the program)
  const escrowKeypair = web3.Keypair.generate();

  // Build raw transaction (do NOT use .rpc() — wallet adapter can drop co-signers)
  const tx = await (program.methods as any)
    .list(price)
    .accounts({
      seller,
      nftMint,
      sellerNftTokenAccount,
      listing,
      escrowNftTokenAccount: escrowKeypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .transaction();

  // Attach blockhash + fee payer before partial sign
  const conn = program.provider.connection;
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = seller;

  // Escrow keypair must sign first (it's paying rent for its own account init)
  tx.partialSign(escrowKeypair);

  // Wallet adapter signs + submits
  const sig = await (program.provider as any).sendAndConfirm(tx, [escrowKeypair], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  return { sig, escrowPubkey: escrowKeypair.publicKey.toBase58() };
}

/**
 * Buys a listed NFT.
 * Transfers SOL from buyer → seller, NFT from escrow → buyer, closes listing.
 */
export async function buyNft(
  program: Program<TcgMarketplace>,
  buyer: PublicKey,
  seller: PublicKey,
  nftMint: PublicKey,
  escrowNftTokenAccount: PublicKey,
  buyerNftTokenAccount: PublicKey
): Promise<string> {
  const [listing] = findListingPda(nftMint);

  const sig = await (program.methods as any)
    .buy()
    .accounts({
      buyer,
      seller,
      listing,
      escrowNftTokenAccount,
      buyerNftTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return sig;
}

/**
 * Removes a listing and returns the NFT to the seller.
 */
export async function delistNft(
  program: Program<TcgMarketplace>,
  seller: PublicKey,
  nftMint: PublicKey,
  escrowNftTokenAccount: PublicKey,
  sellerNftTokenAccount: PublicKey
): Promise<string> {
  const [listing] = findListingPda(nftMint);

  const sig = await (program.methods as any)
    .delist()
    .accounts({
      seller,
      listing,
      escrowNftTokenAccount,
      sellerNftTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return sig;
}

// ─── Account fetcher ──────────────────────────────────────────────────────────

/**
 * Fetches all active Listing accounts from the program.
 * Returns raw on-chain data — map to UI format as needed.
 */
export async function fetchAllListings(
  program: Program<TcgMarketplace>
): Promise<Array<{ publicKey: PublicKey; account: Listing }>> {
  return (program.account as any).listing.all();
}

/**
 * Fetches a single Listing by its NFT mint address.
 */
export async function fetchListing(
  program: Program<TcgMarketplace>,
  nftMint: PublicKey
): Promise<Listing | null> {
  const [pda] = findListingPda(nftMint);
  try {
    return await (program.account as any).listing.fetch(pda);
  } catch {
    return null;
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function solToLamports(sol: number): BN {
  return new BN(Math.floor(sol * LAMPORTS_PER_SOL));
}

export function lamportsToSol(lamports: BN): string {
  return (lamports.toNumber() / LAMPORTS_PER_SOL).toFixed(2);
}
