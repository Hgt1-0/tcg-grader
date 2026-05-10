# 🃏 CardProof: AI-Verified TCG Marketplace

### Project Description
CardProof is an end-to-end, trustless Web3 marketplace for grading and trading Pokémon and Trading Card Game (TCG) cards. Users upload photos of their raw cards, which are instantly graded by an AI Vision model (Groq/LLaMA-3). The certified grade and image are seamlessly minted natively to the Solana blockchain as an SPL Token NFT. 

Once minted, users can interact with our custom Rust smart contract to list their cards on the decentralized marketplace, where atomic transactions ensure trustless Escrow vaults hold the cards until a buyer purchases them using native SOL.

---

### 🏆 Hackathon Qualification Checklist
- [x] **Project Name & Short Description**: CardProof - AI TCG Grading & Marketplace.
- [x] **Unique Solana Program**: Written in Rust (Anchor framework) to handle Listings, Atomic Buys, and Escrow Token Account management.
- [x] **Contract Deployment**: Deployed and fully active on Solana Devnet.
- [x] **Public GitHub Repo**: You are here! README includes setup instructions below.
- [x] **Demo Video & Live Demo**: Links provided below.

---

### 🚀 Live Demo & Video
*   **Live Demo (Vercel):** https://cardproof-henna.vercel.app/
*   **Demo Video (YouTube/Loom):** `[INSERT_YOUR_VIDEO_LINK_HERE]`

---

### 📜 Contract Deployment (Devnet)
Our custom Rust (Anchor) marketplace smart contract is actively deployed on Solana Devnet at the following address:
**Program ID:** `9hFDdjtxZPGe3fnA2wbpAZwXDmqjLYFFhjVXsv1obv1W`

---

### 🌟 Bonus Points: Consistent & Considerable use of Solana SDKs
We heavily utilized `@solana/web3.js` and `@solana/spl-token` natively in the browser to build a rich Web3 experience without relying entirely on third-party custodial APIs:
1.  **Native Front-end Minting:** Instead of using an API, our React frontend builds and signs complex transactions to natively create SPL Token Mints and Associated Token Accounts (ATAs) dynamically via the Phantom Wallet.
2.  **RPC Escrow Resolution:** Instead of relying on local databases to track smart-contract Escrow accounts, our UI dynamically queries the Solana blockchain via `getTokenAccountsByOwner` to locate the exact PDA-owned Vault holding the NFT.
3.  **Atomic Buys:** Our frontend crafts transactions that utilize `.preInstructions` to dynamically create missing ATAs for buyers on the fly, followed by atomic CPI transfers of SOL and SPL tokens in a single instruction.

---

### 🛠️ Local Setup Instructions

#### Prerequisites
*   Node.js (v18+)
*   Phantom Wallet extension installed on your browser (set to Devnet)

#### 1. Start the React Frontend
```bash
cd CardProof
npm install
npm run dev
```

#### 2. Start the AI Grading Backend
Open a new terminal window:
```bash
cd backend
npm install

# Create a .env file and add your Groq API Key for the AI Vision model
echo "GROQ_API_KEY=your_key_here" > .env

node server.js
```

#### 3. Test the Flow
1. Connect your Phantom wallet.
2. Upload a trading card photo (e.g., front and back of a Pokémon card).
3. Wait ~5 seconds for the AI to analyze and grade the centering, corners, and surface.
4. Click **Mint** to natively create an SPL Token of your graded card.
5. Go to the Marketplace and click **List**. Your card will be transferred to a PDA Escrow Vault.
6. Switch wallets (or use the same one) to click **Buy** and watch the atomic smart contract swap SOL for the NFT!
