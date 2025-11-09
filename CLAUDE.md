# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# OneTube - NFT-Gated Video Streaming Platform (MVP)

## Architecture & Technology Stack

**Single Repository** with pnpm:
- **Frontend**: React + Vite + Sui Wallet Adapter
- **Backend**: Express + TypeScript (Mock API)
- **Smart Contract**: Move (Sui Blockchain)
- **Blockchain**: Sui devnet + Kiosk + Walrus + Seal

**Project Structure**:
- `contracts/` - Move smart contracts (NFT minting, Transfer Policy)
- `app/` - React/Vite frontend + Express backend API
- `scripts/` - Deployment and utility scripts
- `tests/` - E2E and integration tests
- `docs/` - Project specifications and issue tracking

**Core Business Logic**:
- NFT-based video access control
- Kiosk standard for NFT sales
- Sponsored Transaction for gasless purchases (mock)
- Automatic revenue split (70% Athlete / 25% ONE / 5% Platform)
- Walrus distributed storage integration
- Seal encryption/decryption for access control

## Essential Development Commands

**Package Manager**: pnpm v10.20.0

```bash
# Development
pnpm install                    # Install dependencies
pnpm run dev                    # Start development server
pnpm run build                  # Build for production

# Smart Contract (Move)
sui move build                  # Build Move contracts
sui move test                   # Run Move tests
sui client publish              # Deploy to devnet

# Testing
pnpm run test                   # Run all tests
pnpm run test:e2e              # Run E2E tests

# Code Quality
pnpm run lint                   # Run Biome linter
pnpm run format                 # Format code with Biome
pnpm run typecheck             # TypeScript type checking
```

## Issue-Driven Development Workflow

This project uses **Issue-Driven Development** with Claude Code's three main commands:

### Development Flow

```
/specify → /plan → /tasks → Implementation
```

| Command | Purpose | Output File |
|---------|---------|-------------|
| `/specify` | Create feature specification | Optional: Chat history or `docs/issues/<branch-name>/spec.md` |
| `/plan` | Generate implementation plan | Optional: Chat history or `docs/issues/<branch-name>/plan.md` |
| `/tasks` | Break down into tasks | Optional: TodoWrite tool or `docs/issues/<branch-name>/tasks.md` |
| `/execute` | Execute tasks from plan | Uses package.json scripts (pnpm move:test, deploy:devnet, etc.) |

**Note**: For MVP development, file creation is **completely optional**. Use chat history + TodoWrite tool for simplicity.

### When to Create an Issue

**✅ Create an issue when:**
- Implementation takes 3+ days
- Changes span multiple files
- Feature is clearly separable
- Collaboration is needed

**Examples:**
```
✅ 001-smart-contract-deployment
   - NFT structure definition
   - mint_batch implementation
   - Transfer Policy configuration
   → Multiple files, complex implementation

✅ 002-kiosk-integration
   - Kiosk purchase processing
   - Inventory management
   → 3+ days, clear feature boundary
```

**❌ Do NOT create an issue for:**
- Small bug fixes
- UI tweaks (colors, fonts, layout)
- Environment variable additions
- Simple refactoring
- Documentation updates

**Examples:**
```
❌ "Change button color from blue to green"
   → Single file, 5 minutes

❌ "Fix error message text"
   → Minor change

→ Directly ask Claude Code instead
```

### Implementation Process

**Step 1: Specification (`/specify`)**
```bash
/specify "NFT purchase flow: Kiosk integration with Sponsored Transaction"
```
- Generates `spec.md` with requirements
- Defines success criteria
- Lists dependencies

**Step 2: Planning (`/plan`)**
```bash
/plan
```
- Generates `plan.md` with implementation steps
- Proposes test strategy
- Provides time estimates

**Step 3: Task Breakdown (`/tasks`)**
```bash
/tasks
```
- Generates `tasks.md` with concrete tasks
- Includes test tasks
- Provides checkboxes for tracking

**Step 4: Implementation (`/execute` or manual)**
- Implement **one task at a time**
- Run tests after each task using package.json scripts
- Update task checkboxes (in TodoWrite tool or tasks.md)
- Report issues immediately to Claude Code

**Branch Naming (Flexible)**:
- `feature/<user-name>` - User-based development (e.g., `feature/yuseiwhite`)
- `feature/<feature-name>` - Feature-based (e.g., `feature/nft-purchase`)
- `feature/###-<feature-name>` - Optional numbered format for compatibility

**File Storage (Optional)**:
If you choose to save files, they can be stored in:
- `docs/issues/<branch-name>/spec.md` - Feature specification
- `docs/issues/<branch-name>/plan.md` - Implementation plan
- `docs/issues/<branch-name>/tasks.md` - Task breakdown

**MVP Recommendation**: Use **chat history + TodoWrite tool** instead of creating files.

## Code Quality & Linting

**Biome Configuration**:
- Linter and Formatter in one tool
- Configuration in `biome.json` (if exists) or root package.json
- Fast performance with minimal configuration

**Package.json Scripts**:
- `"lint"`: Run Biome linter
- `"format"`: Format code with Biome
- `"typecheck"`: Run TypeScript compiler checks

## Key Development Principles

### MVP Design Philosophy

**Priority Order:**
1. **Working** → Tests pass
2. **Simple** → Code is readable
3. **Fast to write** → Minimal boilerplate
4. Extensibility is ignored (MVP goal achievement is top priority)

**SOLID Principles Application:**
- **Single Responsibility**: ⚠️ Minimal (App.tsx can be multi-purpose)
- **Open/Closed**: ❌ Ignore extensibility
- **Liskov Substitution**: ❌ No inheritance
- **Interface Segregation**: ⚠️ Minimal interfaces
- **Dependency Inversion**: ✅ DI pattern partially applied

### Test-Driven Development (TDD)

**Test Priority Order:**
```
1. Contract Test (Highest Priority)
   - Smart contract functionality
   - Kiosk, Walrus, Seal integration tests

2. Integration Test
   - API integration tests
   - Backend ↔ Smart Contract

3. E2E Test
   - Complete purchase flow
   - Complete viewing flow

4. Unit Test
   - Individual function tests
```

**TDD Workflow:**
```bash
# 1. Write tests first
"Write tests for sponsor.ts first.
Test cases:
- Normal: Transaction construction succeeds
- Error: Invalid private key throws error"

# 2. Run tests (confirm failure)
pnpm test

# 3. Implement
"Implement sponsorPurchase function to pass tests"

# 4. Run tests (confirm success)
pnpm test

# 5. Refactor (if needed)
"Refactor sponsorPurchase to improve error handling"
```

**Important**: Always use **real dependencies** (actual DB, not mocks) for integration tests

### Sui Ecosystem Integration

- Always use Kiosk standard for NFT sales
- Follow Move best practices and conventions
- Reference official Sui documentation for implementation patterns
- Use Sui devnet for all testing
- Never deviate from Kiosk standard without explicit approval

### Mock Implementation Strategy

For MVP, the following are **mock implementations**:
- **Sponsored Transaction**: Server-side signing with .env private key
- **Seal Decryption**: Mock session key generation
- **Video Storage**: Mock videos on Walrus site

Real implementations are deferred to **Phase 2** (post-MVP)

## Project-Specific Implementation Notes

### NFT & Kiosk Integration
- NFTs minted via `mint_batch` function in Move contract
- Deposited to Kiosk for sale
- Fixed price: 0.5 SUI (testnet)
- Transfer Policy handles automatic revenue distribution

### Sponsored Transaction (Mock Implementation)
- Backend server sponsors gas fees
- Private key stored in `.env` (SPONSOR_PRIVATE_KEY)
- User only pays NFT purchase price
- Full implementation deferred to future phase

### Walrus & Seal (Mock Implementation)
- Video storage: Mock videos deployed to Walrus site
- Encryption: Mock implementation using .env variables
- Session management: 30 seconds for testing (configurable via SEAL_SESSION_DURATION)
- Decryption key: Stored in .env (SEAL_DECRYPTION_KEY)

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Network
NETWORK=devnet
RPC_URL=https://fullnode.devnet.sui.io:443

# Contract IDs (auto-updated after deployment)
PACKAGE_ID=0x...
KIOSK_ID=0x...
KIOSK_CAP_ID=0x...
TRANSFER_POLICY_ID=0x...
KIOSK_PACKAGE_ID=0x...              # Official Kiosk package

# Sponsored Transaction (Mock)
SPONSOR_PRIVATE_KEY=suiprivkey...   # Server private key

# Session Management (Mock)
SEAL_SESSION_DURATION=30            # Seconds (30 for testing, 3600 for production)
SEAL_DECRYPTION_KEY=your-seal-key   # Seal decryption key

# Walrus (Mock)
WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Seal (Mock)
SEAL_POLICY_ID=0x...                # Auto-updated after deployment
```

## Effective Communication with Claude Code

### Good Request Examples

**❌ Bad:**
```
"Implement purchase functionality"
→ Too abstract
```

**✅ Good:**
```
"Implement the Backend Signature Service for sponsored transactions.

Specifically:
1. Create app/src/server/sponsor.ts file
2. Implement sponsorPurchase function
3. Build transaction using Sui SDK
4. Sign with SPONSOR_PRIVATE_KEY from .env

Test with: pnpm test:api

Reference:
- docs/project-spec.md for Sponsored Transaction mock implementation
- Previous chat history for design decisions"
```

**Key Points:**
- ✅ Specific file names
- ✅ Function names to implement
- ✅ Technology stack to use
- ✅ Reference documentation

### Reporting Issues

**❌ Bad:**
```
"Error occurred"
→ Insufficient information
```

**✅ Good:**
```
"Error in app/src/server/sponsor.ts sponsorPurchase function.

Error message:
```
Error: Invalid private key format
  at KeyPair.fromSecretKey (sui.js:123)
  at sponsorPurchase (sponsor.ts:45)
```

Command executed:
```
pnpm test:api
```

Environment:
- Node.js: v20.10.0
- @mysten/sui.js: 0.50.0
- SPONSOR_PRIVATE_KEY is set in .env

Expected behavior:
Transaction should be constructed and signed successfully
```

**Key Points:**
- ✅ Full error message
- ✅ Command executed
- ✅ Environment info
- ✅ Expected behavior

## Project Structure Details

### Directory Structure

```
one-tube/
├─ contracts/                         # Move (Kiosk-based)
│  ├─ Move.toml                       # [package] name = "contracts"
│  ├─ sources/
│  │  └─ contracts.move               # mint_batch, distribution hook
│  └─ tests/
│     └─ contracts_tests.move         # Unit tests
│
├─ app/                               # Vite (React) + Express (API) combined
│  ├─ index.html
│  ├─ src/
│  │  ├─ main.tsx                     # FE entry point
│  │  ├─ App.tsx                      # All UI (200-300 lines)
│  │  ├─ lib/                         # FE (Browser) side
│  │  │  ├─ sui.ts                    # RPC reads
│  │  │  └─ api.ts                    # /api calls
│  │  ├─ server/                      # API (Node/Express) side
│  │  │  ├─ server.ts                 # Express API definition
│  │  │  ├─ sponsor.ts                # Sponsored Tx signing
│  │  │  ├─ kiosk.ts                  # Kiosk operations
│  │  │  └─ seal-mock.ts              # Seal mock
│  │  ├─ assets/                      # Mock videos
│  │  │  └─ mock-videos.json          # Mock video metadata
│  │  └─ styles.css
│  ├─ vite.config.ts
│  ├─ tsconfig.json                   # FE config
│  ├─ tsconfig.node.json              # server config
│  └─ package.json
│
├─ scripts/
│  ├─ tool.ts                         # CLI (deploy/seed/demo)
│  └─ update-package-id.ts            # Update .env after deploy
│
├─ tests/
│  └─ e2e.spec.ts                     # devnet E2E
│
├─ docs/
│  ├─ project-spec.md                 # Project specification
│  ├─ development-workflow.md         # Development workflow guide
│  ├─ design.md                       # System design
│  ├─ templates/                      # Templates for commands (optional)
│  ├─ scripts/                        # Utility scripts
│  └─ issues/                         # Optional issue tracking
│     └─ <branch-name>/               # Flexible: yuseiwhite, nft-purchase, 001-...
│        ├─ spec.md                   # (Optional - chat history is fine)
│        ├─ plan.md                   # (Optional - chat history is fine)
│        └─ tasks.md                  # (Optional - use TodoWrite tool)
│
├─ .env.example                       # Environment variable template
├─ package.json                       # Root
└─ README.md
```

**File Count: ~20 files (8 core implementation files)**

### Component Design

**App.tsx (Single Component, 200-300 lines)**
```typescript
// Single component approach
export function App() {
  // State management
  const [wallet, setWallet] = useState<WalletAdapter>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video>();
  const [session, setSession] = useState<Session>();

  // Purchase handler
  async function handlePurchase(listingId: string) {
    // Call /api/purchase via lib/api.ts
  }

  // Watch handler
  async function handleWatch(videoId: string) {
    // Call /api/watch via lib/api.ts
  }

  return (
    <div>
      {/* Wallet connection button */}
      {/* Video list */}
      {/* Selected video player */}
      {/* Purchase button */}
    </div>
  );
}
```

**Why no component splitting:**
- MVP prioritizes simplicity
- State management stays simple
- Entire flow visible in one file

## Documentation

**Key Documentation Files**:
- `docs/project-spec.md` - Complete project specification
- `docs/development-workflow.md` - Detailed development workflow guide
- `docs/design.md` - System design and architecture
- `README.md` - Project overview and quick start guide

**Before implementing new features**:
1. Read `docs/project-spec.md` for business requirements
2. Check `docs/development-workflow.md` for implementation process
3. Optionally use `/specify`, `/plan`, `/tasks` commands (file creation is optional)
4. For MVP: Use chat history + TodoWrite tool instead of creating files

## MVP Development Roadmap

### Planned Issues for MVP

| Issue # | Feature Name | Implementation | Priority |
|---------|-------------|----------------|----------|
| 001 | smart-contract-deployment | NFT structure, mint_batch, Transfer Policy | 🔴 Required |
| 002 | kiosk-integration | Kiosk purchase, inventory management | 🔴 Required |
| 003 | sponsored-transaction | Backend signing service, gas sponsorship | 🔴 Required |
| 004 | walrus-seal-integration | Walrus BLOB storage, Seal encryption/decryption | 🔴 Required |
| 005 | frontend-ui | Video list, purchase button, video player | 🔴 Required |

### Implementation Order

```
Phase 1: Smart Contract Foundation
  └─ 001-smart-contract-deployment

Phase 2: Backend Integration
  ├─ 003-sponsored-transaction
  └─ 004-walrus-seal-integration

Phase 3: Kiosk Integration
  └─ 002-kiosk-integration

Phase 4: Frontend
  └─ 005-frontend-ui
```

**Important**: Do NOT create all issues at once. Create each issue right before implementation using `/specify`.

### Development Flow (Full Cycle)

```bash
# 1. Environment setup
pnpm install

# 2. Contract development
cd contracts
sui move build
sui move test

# 3. Deploy
pnpm deploy:devnet

# 4. Seed
pnpm seed:devnet

# 5. Start frontend
pnpm dev

# 6. E2E test
pnpm test:e2e
```

## MVP Scope

### ✅ MVP Features (To Be Implemented)
- Kiosk standard API for NFT sales
- Move smart contract with `mint_batch` and Transfer Policy
- Sponsored Transaction (mock implementation)
- Revenue distribution (70%/25%/5% automatic split)
- Walrus BLOB storage (mock videos on Walrus site)
- Seal integration (mock session management, 30s duration)
- Simple React UI (single App.tsx component)

### ❌ Future Features (Out of MVP Scope)
- OAuth/zkLogin authentication (Sui Wallet only for MVP)
- Real streaming delivery (HLS/DASH)
- Complex component architecture
- State management libraries (Redux, Zustand, etc.)
- Production security hardening
- Performance optimization
- Multiple NFT types (athlete NFTs, ticket NFTs, etc.)
- Real Sponsored Transaction implementation
- Real Seal encryption/decryption

## Development Checklists

### Before Starting Implementation

- [ ] Read `docs/project-spec.md` for full context
- [ ] Understand the business requirements
- [ ] Check if feature requires planning (3+ days or multiple files)
- [ ] If planning needed (optional):
  - [ ] Optionally run `/specify` (chat history is fine for MVP)
  - [ ] Review specification for completeness
  - [ ] Optionally run `/plan` (chat history is fine for MVP)
  - [ ] Review plan for proper test coverage
  - [ ] Optionally run `/tasks` (TodoWrite tool recommended for MVP)
  - [ ] Review task list for concrete action items
- [ ] Check dependencies are installed (`pnpm install`)
- [ ] Verify environment variables are set (`.env` exists)

### During Implementation

- [ ] Implement **one task at a time**
- [ ] Follow TDD: Write test → Run (fail) → Implement → Run (pass)
- [ ] Test priority: Contract → Integration → E2E → Unit
- [ ] Update task checkboxes (TodoWrite tool or tasks.md) as you complete them
- [ ] Run tests after each task using package.json scripts
- [ ] Report issues to Claude Code immediately with full context

### After Implementation

- [ ] All tasks (in TodoWrite tool or tasks.md) are checked off
- [ ] All tests pass:
  - [ ] Contract tests (`sui move test`)
  - [ ] Integration tests (`pnpm test:api`)
  - [ ] E2E tests (`pnpm test:e2e`)
- [ ] Documentation updated:
  - [ ] README.md (if user-facing changes)
  - [ ] Environment variables documented
  - [ ] API endpoints documented (if added)
- [ ] Code review completed (if applicable)
- [ ] Deployed to devnet and tested:
  - [ ] Smart contract deployed successfully
  - [ ] All flows work end-to-end
  - [ ] Error handling works correctly

### Pre-Production Checklist (Future)

- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Load testing passed
- [ ] Monitoring and logging in place
- [ ] Mainnet deployment plan ready

**Note**: Pre-production items are out of MVP scope

## References

- **Sui Documentation**: https://docs.sui.io/
- **Move Language**: https://move-language.github.io/move/
- **Kiosk Standard**: https://docs.sui.io/standards/kiosk
- **Walrus**: https://docs.walrus.site/
- **Sui TypeScript SDK**: https://sdk.mystenlabs.com/typescript
- **Project Specification**: `docs/project-spec.md`
- **Development Workflow**: `docs/development-workflow.md`
- **System Design**: `docs/design.md`

## Quick Reference

### Common Commands

```bash
# Development
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server

# Smart Contract
sui move build                  # Build contracts
sui move test                   # Test contracts
sui client publish              # Deploy to devnet

# Testing
pnpm test                       # Run all tests
pnpm test:e2e                  # Run E2E tests

# Code Quality
pnpm run lint                   # Lint code
pnpm run format                 # Format code
pnpm run typecheck             # Type check
```

### Claude Code Commands with Integrated Guardrails

| Command | Integrated Scripts | Purpose |
|---------|-------------------|---------|
| `/specify` | `create-new-feature.sh` | Feature specification with branch setup |
| `/plan` | `setup-plan.sh`, `get-feature-paths.sh` | Implementation plan with directory structure |
| `/tasks` | `check-task-prerequisites.sh` | Task breakdown with prerequisite validation |
| `/execute` | `execute-next-tasks.sh`, `check-packages.sh` | Task execution with quality gates |

**Workflow Integration**:
```bash
# 1. Create new feature with guardrails
pnpm feature:new "my-feature"  # or use /specify command

# 2. Plan implementation (validates spec exists)
/plan  # Uses setup-plan.sh internally

# 3. Create tasks (validates plan exists)
pnpm check:prereq  # Check prerequisites
/tasks  # Generate task list

# 4. Execute with quality gates
/execute  # Includes progress tracking and package checks
pnpm check:packages  # Pre-commit quality gate
```

**Convenience Scripts** (via package.json):
```bash
pnpm check:packages   # Multi-package quality check (lint, typecheck, build, test)
pnpm check:prereq     # Validate plan.md exists and find design docs
pnpm track:debt       # Track technical debt (biome-ignore comments)
pnpm feature:new      # Create new feature branch (user-based, no docs)
pnpm workflow:paths   # Display feature directory paths
```

### File Paths for Common Tasks

- **Smart Contract**: `contracts/sources/contracts.move`
- **Frontend Entry**: `app/src/main.tsx`
- **Main UI**: `app/src/App.tsx`
- **API Server**: `app/src/server/server.ts`
- **Sui Client**: `app/src/lib/sui.ts`
- **API Client**: `app/src/lib/api.ts`
- **Environment**: `.env` (copy from `.env.example`)

<!-- MANUAL ADDITIONS START -->

<!-- MANUAL ADDITIONS END -->
