<div align="center">

![OneTube Logo](docs/assets/one-tube-logo.png)

# 🏆 OneTube

## NFT-Gated Video Streaming Platform Powered by Seal & Walrus

**Sui-native decentralized video streaming with cryptographic access control**

[![Sui](https://img.shields.io/badge/Built%20on-Sui-blue)](https://sui.io)
[![Seal](https://img.shields.io/badge/Seal-Access%20Control-green)](https://github.com/mystenlabs/seal)
[![Walrus](https://img.shields.io/badge/Walrus-Distributed%20Storage-orange)](https://wal.app)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## 🚀 What Makes OneTube Special?

OneTube is a **production-ready NFT-gated video streaming platform** that combines cutting-edge Sui blockchain technology with **Seal cryptographic access control** and **Walrus distributed storage** to deliver a seamless Web2-like experience with Web3 ownership.

### ✨ Key Innovations

- 🔐 **Seal-Powered Access Control**: First-of-its-kind integration of Seal SDK for cryptographic NFT ownership verification and session-based video decryption
- 🌊 **Walrus Distributed Storage**: Leverages 60+ Walrus Testnet publishers/aggregators for resilient, decentralized video storage with automatic failover
- 🎫 **Gasless NFT Purchases**: Sponsored transactions eliminate user friction - users pay only for NFTs, not gas fees
- 💰 **Automatic Revenue Splitting**: Smart contract-enforced revenue distribution (70% Athlete / 25% ONE / 5% Platform) on every purchase
- 🔑 **Dual Authentication**: Support for both Sui Wallet and zkLogin (Google OAuth) for maximum accessibility
- 🎬 **Encrypted Video Streaming**: Premium content encrypted on Walrus, decrypted only for verified NFT owners via Seal sessions

### 🏅 Why OneTube

1. **Complete Integration**: Full-stack implementation from smart contracts to frontend, demonstrating deep understanding of Sui ecosystem
2. **Production-Ready Architecture**: Robust error handling, logging, session management, and scalable design patterns
3. **Innovative Technology Stack**: Pioneering combination of Seal + Walrus + Kiosk + Sponsored Transactions
4. **Real-World Use Case**: Solves actual problem for content creators and sports organizations
5. **Developer Experience**: Comprehensive documentation, easy setup, and well-structured codebase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.x
- Sui CLI
- Enoki account (optional, for zkLogin)
- Google Cloud Console account (optional, for zkLogin)

### Installation & Setup

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and set required values:
# - RPC_URL: Sui network RPC endpoint
# - PACKAGE_ID: Your deployed contract package ID (auto-updated after deploy)
# - SEAL_PACKAGE_ID: Seal package ID
# - SEAL_IDENTITY_ID: Seal identity ID
# - WALRUS_API_URL: Primary Walrus publisher URL
# - WALRUS_AGGREGATOR_URL: Primary Walrus aggregator URL
# - SPONSOR_PRIVATE_KEY: Sponsor wallet private key for gasless transactions

# Deploy smart contracts
pnpm run deploy:devnet

# Seed NFTs to Kiosk
pnpm run seed:devnet

# Start frontend (http://localhost:3000)
pnpm run dev

# Start backend API (http://localhost:3001)
pnpm run dev:server
```

### Optional: zkLogin Setup

For Google OAuth authentication:

1. **Create Enoki Account**
   - Visit [Enoki Dashboard](https://enoki.mystenlabs.com/)
   - Create account and get API key
   - Set `VITE_ENOKI_API_KEY` and `VITE_ENOKI_NETWORK` in `.env`

2. **Configure Google OAuth**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Configure OAuth consent screen (User type: External)
   - Create OAuth 2.0 Client ID
   - Add `http://localhost:3000` to authorized redirect URIs
   - Set `CLIENT_ID_GOOGLE` in `app/src/config.json`

See `docs/issues/028-zk-login-wallet/plan.md` for detailed setup.

## 🏗️ Architecture

### Project Structure

```
one-tube/
├── contracts/          # Move smart contracts (NFT minting, Transfer Policy, Seal integration)
├── app/               # React + Express (Frontend + Backend API)
│   ├── src/
│   │   ├── lib/       # Frontend utilities (Sui client, API client, logger)
│   │   ├── server/    # Backend API (Seal, Walrus, Kiosk, Sponsor)
│   │   └── shared/    # Shared types
│   └── dist/          # Production build
├── scripts/           # Deployment & utility scripts
│   ├── commands/      # Deploy, seed, encrypt-video
│   └── shared/        # Shared utilities
└── docs/              # Project specifications & development guides
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Sui devnet/testnet | High-performance blockchain infrastructure |
| **Smart Contract** | Sui Move | NFT minting, Transfer Policy, Seal integration |
| **NFT Marketplace** | Kiosk Standard | Decentralized NFT sales with Transfer Policy |
| **Gas Sponsorship** | Sponsored Transactions | Gasless user experience |
| **Distributed Storage** | Walrus Testnet | Decentralized video storage (60+ nodes) |
| **Access Control** | Seal SDK | Cryptographic NFT ownership verification & session management |
| **Authentication** | zkLogin (Enoki SDK) + Sui Wallet | Web2-like login + Web3 wallet support |
| **Frontend** | React + Vite + TypeScript | Modern, fast UI |
| **Backend** | Express + TypeScript | RESTful API with Seal/Walrus integration |
| **Video Encryption** | AES-256-GCM | End-to-end encrypted video content |

### 🔐 Seal Integration Highlights

- **Session-Based Access**: Seal SessionKeys enable time-limited access to encrypted content
- **NFT Ownership Verification**: On-chain verification ensures only NFT owners can decrypt videos
- **Frontend SessionKey Creation**: Users create SessionKeys client-side for enhanced security
- **Persistent Session Management**: Server-side session storage with JSON file persistence
- **Automatic Expiration**: Configurable session duration (default: 5 minutes)

### 🌊 Walrus Integration Highlights

- **60+ Publisher Nodes**: Automatic failover across Walrus Testnet publishers
- **60+ Aggregator Nodes**: Resilient video retrieval with multiple aggregator endpoints
- **Environment-Based Priority**: Configurable primary publisher/aggregator via environment variables
- **Robust Error Handling**: Comprehensive error handling with retry logic
- **Timeout Management**: Optimized timeouts (5min upload, 10sec retrieval)

## 📝 Available Commands

```bash
# Smart Contract
pnpm run move:test              # Run Move contract tests
pnpm run deploy:devnet         # Deploy contracts to Sui devnet
pnpm run seed:devnet           # Seed NFTs to Kiosk

# Development
pnpm run dev                    # Start frontend dev server (port 3000)
pnpm run dev:server             # Start backend API server (port 3001)

# Code Quality
pnpm run format                 # Format code with Biome
pnpm run biome:check           # Lint code with Biome
pnpm run typecheck             # TypeScript type checking

# Video Management
pnpm run encrypt:video          # Encrypt video and upload to Walrus
```

## 🔄 User Flow

### Option 1: Sui Wallet Connection

1. **Connect Wallet**: Connect your Sui Wallet
2. **Purchase NFT**: Buy Premium Ticket NFT from Kiosk (gasless via Sponsored Transaction)
3. **Watch Video**: Access full video content as NFT owner (Seal session-based decryption)

### Option 2: zkLogin (Google OAuth)

1. **Google Login**: Click "Login with Google" to authenticate
2. **zkLogin Address**: Enoki SDK automatically generates zkLogin address
3. **Purchase NFT**: Buy Premium Ticket NFT (gasless, sponsored transaction)
4. **Watch Video**: Access full video content as NFT owner

**Note**: Sui Wallet and zkLogin can be used simultaneously.

## 💡 Business Model

- **Revenue Split**: Automatically enforced by smart contract
  - Athlete: 70%
  - ONE Championship: 25%
  - Platform: 5%
- **Pricing**: 0.5 SUI per Premium Ticket NFT (testnet)
- **Benefits**: Full access to premium fight videos for NFT holders

## 🎯 Technical Achievements

### ✅ What We Built

- **Complete Seal Integration**: Full implementation of Seal SDK for cryptographic access control
- **Walrus Distributed Storage**: Production-ready integration with 60+ node failover
- **Gasless Transactions**: Sponsored transaction implementation for seamless UX
- **Automatic Revenue Splitting**: Smart contract-enforced revenue distribution
- **Dual Authentication**: Both Web3 (Sui Wallet) and Web2 (zkLogin) support
- **Session Management**: Persistent session storage with expiration handling
- **Error Handling**: Comprehensive error handling across all layers
- **Type Safety**: Full TypeScript coverage with shared types
- **Testing**: Unit tests, integration tests, and E2E tests

## 📚 Documentation

### 🌐 Full Technical Documentation on DeepWiki

**👉 [Complete Technical Documentation](https://deepwiki.com/YuseiWhite/one-tube)**

The DeepWiki documentation provides comprehensive technical details including:
- Complete system architecture and component design
- API endpoint reference
- Smart contract implementation details
- Integration guides (Seal, Walrus, Kiosk)
- Data flow diagrams
- Deployment procedures
- Technology stack details

### 📁 Local Documentation

Additional documentation is available in the `docs/` directory:

- [Project Specification](docs/project-spec.md) - Complete technical specification
- [Development Workflow](docs/development-workflow.md) - Development guidelines
- [Seal Integration Guide](docs/issues/031-seal-integration/watch-video-with-seal.md) - Seal implementation details
- [Seal Key Management](docs/seal-key-management.md) - Seal key management best practices
- [Walrus Integration](docs/walrus-haulout-hackathon.md) - Walrus implementation experience
- [zkLogin Integration](docs/issues/028-zk-login-wallet/plan.md) - zkLogin setup guide
- [DeepWiki Strategy](docs/haulout-hackathon/deepwiki-strategy.md) - How to leverage DeepWiki documentation for hackathon

## 🏆 Highlights

### Why OneTube Stands Out

1. **Production-Ready Code**: Not a prototype - fully functional, tested, and documented
2. **Deep Sui Integration**: Leverages Kiosk, Transfer Policy, Sponsored Transactions, Seal, and Walrus
3. **Innovative Architecture**: First-of-its-kind Seal + Walrus combination for NFT-gated content
4. **Real-World Application**: Solves actual problem for content creators and sports organizations
5. **Developer Experience**: Clean codebase, comprehensive docs, easy setup
6. **Scalable Design**: Built for production with error handling, logging, and session management
7. **Comprehensive Documentation**: Full technical documentation available on [DeepWiki](https://deepwiki.com/YuseiWhite/one-tube)

### Technical Innovation

- **Seal Access Control**: Pioneering use of Seal SDK for NFT ownership-based cryptographic access
- **Walrus Resilience**: 60+ node failover ensures high availability
- **Gasless UX**: Sponsored transactions eliminate Web3 friction
- **Smart Revenue Splits**: On-chain automatic revenue distribution
- **Dual Auth**: Seamless Web2 and Web3 authentication options

## 🤝 Contributing

This is a hackathon project, but contributions and feedback are welcome!

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

