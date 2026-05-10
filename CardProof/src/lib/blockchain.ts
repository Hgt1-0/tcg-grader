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
  TransactionMessage,
  VersionedTransaction,
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
import { Transaction } from "@solana/web3.js";

export async function listNft(
  program: Program<TcgMarketplace>,
  seller: PublicKey,
  nftMint: PublicKey,
  sellerNftTokenAccount: PublicKey,
  priceInSol: number,
  signTransaction: any,
  connection: any
): Promise<{ sig: string; escrowPubkey: string }> {
  const [listing] = findListingPda(nftMint);
  const price = new BN(Math.floor(priceInSol * LAMPORTS_PER_SOL));

  // Fresh keypair for the escrow token account
  const escrowKeypair = web3.Keypair.generate();

  // 1. Build the actual 'list' instruction
  // The Rust smart contract handles the account creation internally via CPI because of the `init` macro.
  const listIx = await (program.methods as any)
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
    .instruction();

  // **CRITICAL FIX**: The IDL is missing the "signer" flag for the escrow account,
  // but it is required because the Rust code creates it via CPI.
  const escrowKeyIndex = listIx.keys.findIndex(k => k.pubkey.equals(escrowKeypair.publicKey));
  if (escrowKeyIndex !== -1) {
    listIx.keys[escrowKeyIndex].isSigner = true;
  }

  // 2. Construct standard legacy Transaction
  const tx = new Transaction().add(listIx);

  // 4. Get latest blockhash and set fee payer
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = seller;

  // 5. Raw sign and send sequence
  // We use signTransaction to get Phantom's signature first so it doesn't strip our partial sign.
  const signedTx = await signTransaction(tx);
  
  // Now we safely add our escrow keypair's signature locally
  signedTx.partialSign(escrowKeypair);

  // Submit to RPC directly to get detailed error logs if it fails on-chain
  const rawTx = signedTx.serialize();
  const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: false });
  await connection.confirmTransaction(sig, "confirmed");

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

  // Check if buyer has the ATA, if not, we must create it!
  const { createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");
  const connection = program.provider.connection;
  const buyerAtaInfo = await connection.getAccountInfo(buyerNftTokenAccount);
  
  const preIxs = [];
  if (!buyerAtaInfo) {
    preIxs.push(createAssociatedTokenAccountInstruction(buyer, buyerNftTokenAccount, buyer, nftMint));
  }

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
    .preInstructions(preIxs)
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
