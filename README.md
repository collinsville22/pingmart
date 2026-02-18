# PingMart

Cross-chain domain marketplace powered by AI. Register names across Ethereum (ENS), Base (Basenames), Solana (SNS), NEAR, and Arbitrum (.arb) - pay with crypto or fiat via PingPay.

## Demo

[![PingMart Demo](https://img.youtube.com/vi/5jgngAnF86c/maxresdefault.jpg)](https://youtu.be/5jgngAnF86c)

## Features

- **AI-Powered Search** - Natural language domain discovery with Claude Sonnet
- **Multi-Chain** - ENS, Basenames, Solana SNS, NEAR accounts, Arbitrum .arb
- **Unified Checkout** - PingPay hosted checkout (crypto + fiat)
- **Automated Registration** - Payment triggers on-chain registration via Defuse cross-chain swaps
- **Real-Time Status** - Webhook-driven order tracking with live progress

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- SQLite (better-sqlite3)
- Vercel AI SDK + Claude Sonnet
- PingPay for payments
- Defuse Protocol for cross-chain swaps

## Getting Started

```bash
npm install
cp .env.example .env.local  # add your keys
npm run dev
```

## Architecture

```
User searches domain
  -> AI agent checks availability + pricing across chains
  -> User selects domain + enters wallet address
  -> Order created -> PingPay checkout session
  -> Payment confirmed via webhook
  -> USDC swapped to target chain via Defuse
  -> Domain registered on-chain -> ownership transferred to buyer
```

## License

MIT
