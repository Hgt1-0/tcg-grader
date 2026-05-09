/**
 * useProgram — Returns an initialised @coral-xyz/anchor Program instance
 * for the tcg_marketplace contract, bound to the connected wallet.
 *
 * Usage:
 *   const { program, provider } = useProgram();
 *   if (!program) return; // wallet not connected yet
 */

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import IDL from "./idl/tcg_marketplace.json";
import type { TcgMarketplace } from "./idl/types";

export const PROGRAM_ID = new PublicKey(
  "Gpq4aTWinuJqfKk7X3v5zuQ9USbSwG35d2Lh9SGMSYTt"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      return null;
    }
    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(
      IDL as Idl,
      provider
    ) as unknown as Program<TcgMarketplace>;
  }, [provider]);

  return { program, provider, connection, wallet };
}
