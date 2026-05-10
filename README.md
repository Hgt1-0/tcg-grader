# TCG Grader (CardProof)

CardProof is a full-stack demo for **AI-assisted trading card grading** and **Solana NFT workflows**. Users upload front and back photos of a card, receive a structured grade inspired by PSA-style criteria, and can mint or trade representations on-chain.

> **Note:** Grades are produced by a vision language model for demonstration only. They are not official certifications from PSA, BGS, CGC, or any third-party grader.

---

## Overview

The repository is organized into three parts:


| Package           | Role                                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**CardProof/`**  | React single-page app: upload flow, results, wallet connection (Phantom on **Solana Devnet**), optional Crossmint minting, and a marketplace UI backed by an Anchor program. |
| `**backend/`**    | Express API: accepts card images, calls **Groq**’s OpenAI-compatible vision API for grading, and integrates **Crossmint** (staging) for email/wallet NFT delivery.           |
| `**blockchain/`** | **Anchor** program `tcg_marketplace`: escrow listings, purchases with SOL, and delisting for SPL NFTs.                                                                       |


In local development, the Vite dev server proxies `/api/`* to the backend so the browser can call grading and mint endpoints without CORS friction.

---

## Tech Stack

**Frontend (`CardProof/`)**

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) (dev server, build)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) patterns (Radix primitives)
- [React Router](https://reactrouter.com/) v6
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) + [Anchor 0.30](https://www.anchor-lang.com/) client
- [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) (Phantom)
- [Framer Motion](https://www.framer.com/motion/), [Recharts](https://recharts.org/), [Lucide](https://lucide.dev/) icons

**Backend (`backend/`)**

- [Node.js](https://nodejs.org/) + [Express 4](https://expressjs.com/)
- [Multer](https://github.com/expressjs/multer) (multipart uploads)
- [Groq](https://groq.com/) via OpenAI-compatible client (`openai` package)
- [Crossmint](https://www.crossmint.com/) REST API (staging)

**On-chain (`blockchain/`)**

- [Anchor](https://www.anchor-lang.com/) + [Rust](https://www.rust-lang.org/) (toolchain pinned in `blockchain/rust-toolchain.toml`)
- [Solana](https://solana.com/) program: list / buy / delist with SPL token transfers

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended) and npm
- For smart contract work: **Rust**, **Solana CLI**, and **Anchor** (see [Anchor docs](https://www.anchor-lang.com/docs/installation))

---

## Installation

Clone the repository and install dependencies **per package** (there is no root `package.json`).

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Groq and Crossmint staging keys (see below)
```

### Frontend

```bash
cd CardProof
npm install
```

### Blockchain (optional — for building or testing the program)

```bash
cd blockchain
# Anchor.toml uses yarn for scripts; install deps with npm or yarn as you prefer
npm install
# or: yarn install
```

---

## Configuration

Backend environment variables are documented in `backend/.env.example`. Summary:


| Variable                  | Purpose                                                 |
| ------------------------- | ------------------------------------------------------- |
| `GROQ_API_KEY`            | Authenticates requests to Groq for vision-based grading |
| `CROSSMINT_API_KEY`       | Crossmint staging API key for `/api/mint`               |
| `CROSSMINT_COLLECTION_ID` | Target collection for minted NFTs                       |
| `PORT`                    | HTTP port (default **3001**)                            |


Copy `backend/.env.example` to `backend/.env` and fill in real values before running the API.

---

## How to Run

You need **both** the backend and the frontend for the full flow (upload → grade → result → mint).

### 1. Start the API

```bash
cd backend
npm start
```

For auto-reload during development:

```bash
npm run dev
```

The server listens on `http://localhost:3001` by default. A quick health check:

```bash
curl http://localhost:3001/health
```

### 2. Start the web app

In a second terminal:

```bash
cd CardProof
npm run dev
```

Open `**http://localhost:5173**` (Vite is configured with `--host` and proxies `/api` to port 3001).

### 3. Use the app

1. **Home (`/`)** — Upload front and back images, then continue to results.
2. **Result (`/result`)** — Calls `POST /api/grade` with compressed images. With a connected Phantom wallet on Devnet, minting can use a **native SPL mint** path; without a wallet, email-based minting uses **Crossmint** via `POST /api/mint`.
3. **Marketplace (`/marketplace`)** — Browse demo listings and interact with the deployed `tcg_marketplace` program on Devnet (wallet required for real transactions).

### Production build (frontend only)

```bash
cd CardProof
npm run build
npm run preview   # optional local preview of the production bundle
```

Serve the `CardProof/dist` output behind a reverse proxy that also routes `/api` to your Node backend, or deploy the API under the same origin.

---

## API Reference (backend)


| Method | Path               | Description                                                                                    |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------- |
| `GET`  | `/health`          | Liveness check                                                                                 |
| `POST` | `/api/grade`       | Multipart fields `frontImage` and `backImage` → JSON `{ card_name, card_type, grade, reason }` |
| `POST` | `/api/mint`        | Multipart `cardImage` + body fields (`email`, `cardName`, `grade`, etc.) → Crossmint mint      |
| `GET`  | `/api/mint/:nftId` | Poll Crossmint NFT status / mint hash                                                          |


Uploaded images are limited to **25 MB** per file on the server.

---

## Blockchain program

The Anchor program in `blockchain/programs/tcg_marketplace` implements marketplace instructions (`list`, `buy`, `delist`). Program ID and cluster defaults live in `blockchain/Anchor.toml`. Run tests (after installing Anchor and Solana tooling):

```bash
cd blockchain
anchor test
# or per Anchor.toml: yarn test
```

The frontend IDL is mirrored under `CardProof/src/lib/idl/` for the wallet integration.

---

## Roadmap

The current `tcg_marketplace` flow is effectively an **atomic swap**: listing, purchase, and delisting each settle in a small number of transactions with immediate escrow release. For **physical vault logistics**—shipping, intake, custody, grading windows, and outbound delivery—that model is too coarse.

A planned upgrade is to evolve the program into a **multi-day state machine** on-chain: explicit states and transitions (for example deposit, in transit, received at vault, held for grading, listed, sold, and released or withdrawn) with **time-bounded steps**, **role-gated actions** (seller, vault operator, buyer), and hooks for **disputes or timeouts** where the chain cannot assume same-block completion. That lets custody, SLAs, and settlement stay aligned with real-world operations instead of treating the trade as a single atomic exchange.

---

## Repository layout

```
tcg-grader/
├── CardProof/          # Vite + React frontend
├── backend/            # Express API (.env from .env.example)
├── blockchain/         # Anchor workspace (tcg_marketplace)
└── README.md
```

---

## Troubleshooting

- **Grading always shows a fallback grade** — Confirm `GROQ_API_KEY` in `backend/.env` and that the backend console shows no Groq errors.
- `**/api` 404 or network errors in the browser** — Ensure the backend is running on port **3001** or update `CardProof/vite.config.ts` `server.proxy['/api'].target`.
- **Wallet / Devnet** — The app uses **Solana Devnet**. Fund Devnet SOL via a faucet if transactions fail.
- **Crossmint mint failures** — Verify staging keys and collection ID; minting is tied to Crossmint’s staging API in the current server implementation.

