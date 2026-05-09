import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TcgMarketplace } from "../target/types/tcg_marketplace";

describe("tcg_marketplace", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TcgMarketplace as Program<TcgMarketplace>;

  it("Is initialized!", async () => {
    // This is a placeholder test that just checks if the program is reachable
    console.log("Program ID:", program.programId.toBase58());
  });
});
