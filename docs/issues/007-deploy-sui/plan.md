# OneTube - デプロイ・シードスクリプト実装計画

## 1. 実装概要

### 目標
Sui devnetへの完全自動デプロイと、NFTの初期セットアップを実現するスクリプトを実装する。

### 実装方針
- **シンプル**: 1ファイル（tool.ts）で全機能実装
- **TDD**: デプロイ前にローカルテスト、デプロイ後に実動作確認
- **実用性**: エラーハンドリング充実、ログ出力豊富

---

## 2. アーキテクチャ設計

### ファイル構成

```
one-tube/
├─ scripts/
│  └─ tool.ts              # メインツール（全コマンド実装）
├─ .env                    # 自動生成される設定ファイル
├─ .env.example            # テンプレート（更新）
├─ tsconfig.json           # TypeScript設定（rootレベル追加）
├─ package.json            # スクリプトコマンド定義済み
└─ README.md               # デプロイ手順追加
```

**設計判断:**
- ❌ `scripts/update-package-id.ts`は分離しない → tool.ts内の関数で実装
- ✅ 1ファイルに集約 → 保守性・可読性優先

### コマンド構造

```typescript
// scripts/tool.ts

// === Main Entry Point ===
async function main() {
  const command = process.argv[2];  // deploy | seed | demo-purchase | demo-view
  const network = getNetworkArg();   // --network devnet

  switch (command) {
    case 'deploy':
      await deployCommand(network);
      break;
    case 'seed':
      await seedCommand(network);
      break;
    case 'demo-purchase':
      await demoPurchaseCommand(network);
      break;
    case 'demo-view':
      await demoViewCommand(network);
      break;
    default:
      showHelp();
  }
}

main().catch(console.error);
```

---

## 3. 実装計画（詳細）

### Phase 1: 環境セットアップ

#### Step 1.1: TypeScript設定ファイル作成

**ファイル**: `tsconfig.json` (rootレベル)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "include": ["scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 1.2: 依存パッケージ追加

```bash
pnpm add -D dotenv @types/node
```

**必要なパッケージ:**
- ✅ `@mysten/sui@^1.44.0` (既存)
- ✅ `tsx@^4.20.6` (既存)
- ✅ `typescript@^5.9.3` (既存)
- 🆕 `dotenv@^16.0.0` (追加)
- 🆕 `@types/node@^22.0.0` (追加)

#### Step 1.3: .env.example更新

```bash
# === Network Configuration ===
NETWORK=devnet
RPC_URL=https://fullnode.devnet.sui.io:443

# === Deployed Contract IDs (auto-generated) ===
PACKAGE_ID=
ADMIN_CAP_ID=
PUBLISHER_ID=

# === Transfer Policy ===
TRANSFER_POLICY_ID=
TRANSFER_POLICY_CAP_ID=

# === Kiosk ===
KIOSK_ID=
KIOSK_CAP_ID=
KIOSK_PACKAGE_ID=0x0000000000000000000000000000000000000000000000000000000000000002

# === Revenue Distribution Addresses ===
ATHLETE_ADDRESS=
ONE_ADDRESS=
PLATFORM_ADDRESS=

# === Sponsored Transaction (Mock) ===
SPONSOR_PRIVATE_KEY=

# === Walrus/Seal (Mock) ===
SEAL_SESSION_DURATION=30
SEAL_DECRYPTION_KEY=mock-seal-key
WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

---

### Phase 2: tool.ts実装（基本構造）

#### Step 2.1: インポートと型定義

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// === Types ===
interface DeployResult {
  packageId: string;
  adminCapId: string;
  publisherId: string;
  policyId: string;
  policyCapId: string;
}

interface SeedResult {
  kioskId: string;
  kioskCapId: string;
  nftIds: string[];
}

interface Config {
  network: string;
  rpcUrl: string;
  packageId: string;
  adminCapId: string;
  publisherId: string;
  policyId: string;
  policyCapId: string;
  kioskId: string;
  kioskCapId: string;
  athleteAddress: string;
  oneAddress: string;
  platformAddress: string;
  sponsorPrivateKey: string;
}
```

#### Step 2.2: ユーティリティ関数

```typescript
// === Configuration ===
function loadConfig(): Config {
  dotenv.config();
  return {
    network: process.env.NETWORK || 'devnet',
    rpcUrl: process.env.RPC_URL || getFullnodeUrl('devnet'),
    packageId: process.env.PACKAGE_ID || '',
    adminCapId: process.env.ADMIN_CAP_ID || '',
    publisherId: process.env.PUBLISHER_ID || '',
    policyId: process.env.TRANSFER_POLICY_ID || '',
    policyCapId: process.env.TRANSFER_POLICY_CAP_ID || '',
    kioskId: process.env.KIOSK_ID || '',
    kioskCapId: process.env.KIOSK_CAP_ID || '',
    athleteAddress: process.env.ATHLETE_ADDRESS || '',
    oneAddress: process.env.ONE_ADDRESS || '',
    platformAddress: process.env.PLATFORM_ADDRESS || '',
    sponsorPrivateKey: process.env.SPONSOR_PRIVATE_KEY || ''
  };
}

// === Sui Client ===
function getClient(network: string): SuiClient {
  const url = getFullnodeUrl(network as any);
  return new SuiClient({ url });
}

// === Keypair管理 ===
function getKeypair(): Ed25519Keypair {
  const privateKey = process.env.SPONSOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SPONSOR_PRIVATE_KEY not found in .env');
  }
  return Ed25519Keypair.fromSecretKey(privateKey);
}

// === Faucet ===
async function requestDevnetFaucet(address: string): Promise<boolean> {
  try {
    const response = await fetch('https://faucet.devnet.sui.io/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } })
    });
    return response.ok;
  } catch (error) {
    console.error('Faucet request failed:', error);
    return false;
  }
}

// === Sleep ===
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === .env更新 ===
function updateEnvFile(data: Partial<Record<string, string>>) {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // .env.exampleをテンプレートとして読み込み
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8')
    : fs.readFileSync(envExamplePath, 'utf-8');

  // 値を置き換え
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env updated');
}

// === ログユーティリティ ===
function printBox(title: string, lines: string[]) {
  const width = 60;
  console.log('┌' + '─'.repeat(width) + '┐');
  console.log('│ ' + title.padEnd(width - 2) + '│');
  console.log('├' + '─'.repeat(width) + '┤');
  lines.forEach(line => {
    console.log('│ ' + line.padEnd(width - 2) + '│');
  });
  console.log('└' + '─'.repeat(width) + '┘');
}
```

---

### Phase 3: deployCommand実装

```typescript
async function deployCommand(network: string) {
  printBox('🚀 Deploy Contract to Sui Devnet', [
    `Network: ${network}`,
    `RPC: ${getFullnodeUrl(network as any)}`
  ]);

  const client = getClient(network);
  let keypair: Ed25519Keypair;

  // 1. Keypair準備（既存 or 新規生成）
  try {
    keypair = getKeypair();
    console.log('✅ Using existing keypair from .env');
  } catch {
    console.log('⚠️  No keypair found, generating new one...');
    keypair = Ed25519Keypair.generate();

    updateEnvFile({
      SPONSOR_PRIVATE_KEY: keypair.getSecretKey()
    });
  }

  const address = keypair.getPublicKey().toSuiAddress();
  console.log(`📍 Deployer Address: ${address}`);

  // 2. Faucetからガス取得
  console.log('\n💰 Requesting gas from faucet...');
  const faucetSuccess = await requestDevnetFaucet(address);
  if (!faucetSuccess) {
    throw new Error('Faucet request failed');
  }

  await sleep(5000);
  console.log('✅ Gas received');

  // 3. Contract Publish
  console.log('\n📦 Publishing contract...');
  const publishResult = await publishContract(client, keypair);

  console.log('✅ Contract published');
  console.log(`   Package ID: ${publishResult.packageId}`);
  console.log(`   Publisher ID: ${publishResult.publisherId}`);
  console.log(`   AdminCap ID: ${publishResult.adminCapId}`);

  // 4. Transfer Policy作成
  console.log('\n🔐 Creating Transfer Policy...');
  const policyResult = await createTransferPolicy(
    client,
    keypair,
    publishResult.packageId,
    publishResult.publisherId
  );

  console.log('✅ Transfer Policy created');
  console.log(`   Policy ID: ${policyResult.policyId}`);
  console.log(`   Policy Cap ID: ${policyResult.policyCapId}`);

  // 5. 収益分配ルール追加
  console.log('\n💸 Adding revenue share rule...');
  await addRevenueShareRule(
    client,
    keypair,
    publishResult.packageId,
    policyResult.policyId,
    policyResult.policyCapId,
    address,
    address,
    address
  );

  console.log('✅ Revenue share rule added (70%/25%/5%)');

  // 6. .env更新
  console.log('\n📝 Updating .env file...');
  updateEnvFile({
    PACKAGE_ID: publishResult.packageId,
    ADMIN_CAP_ID: publishResult.adminCapId,
    PUBLISHER_ID: publishResult.publisherId,
    TRANSFER_POLICY_ID: policyResult.policyId,
    TRANSFER_POLICY_CAP_ID: policyResult.policyCapId,
    ATHLETE_ADDRESS: address,
    ONE_ADDRESS: address,
    PLATFORM_ADDRESS: address,
    SPONSOR_PRIVATE_KEY: keypair.getSecretKey()
  });

  printBox('✅ Deploy Complete', [
    `Package ID: ${publishResult.packageId}`,
    `Transfer Policy: ${policyResult.policyId}`,
    '',
    'Next step: pnpm run seed:devnet'
  ]);
}
```

#### Helper: publishContract

```typescript
async function publishContract(
  client: SuiClient,
  keypair: Ed25519Keypair
): Promise<{ packageId: string; publisherId: string; adminCapId: string }> {
  // sui client publishを実行
  const output = execSync(
    'cd contracts && sui client publish --gas-budget 100000000 --json',
    { encoding: 'utf-8' }
  );

  const result = JSON.parse(output);

  // Package ID取得
  const packageId = result.objectChanges.find(
    (change: any) => change.type === 'published'
  )?.packageId;

  // Publisher ID取得
  const publisherId = result.objectChanges.find(
    (change: any) =>
      change.objectType?.includes('::package::Publisher')
  )?.objectId;

  // AdminCap ID取得
  const adminCapId = result.objectChanges.find(
    (change: any) =>
      change.objectType?.includes('::contracts::AdminCap')
  )?.objectId;

  if (!packageId || !publisherId || !adminCapId) {
    throw new Error('Failed to extract IDs from publish result');
  }

  return { packageId, publisherId, adminCapId };
}
```

#### Helper: createTransferPolicy

```typescript
async function createTransferPolicy(
  client: SuiClient,
  keypair: Ed25519Keypair,
  packageId: string,
  publisherId: string
): Promise<{ policyId: string; policyCapId: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::contracts::create_transfer_policy`,
    arguments: [tx.object(publisherId)]
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true
    }
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error('Transfer Policy creation failed');
  }

  const policyId = result.objectChanges?.find(
    change => change.type === 'created' &&
              change.objectType?.includes('TransferPolicy')
  )?.objectId;

  const policyCapId = result.objectChanges?.find(
    change => change.type === 'created' &&
              change.objectType?.includes('TransferPolicyCap')
  )?.objectId;

  if (!policyId || !policyCapId) {
    throw new Error('Failed to extract Policy IDs');
  }

  return { policyId, policyCapId };
}
```

#### Helper: addRevenueShareRule

```typescript
async function addRevenueShareRule(
  client: SuiClient,
  keypair: Ed25519Keypair,
  packageId: string,
  policyId: string,
  policyCapId: string,
  athleteAddress: string,
  oneAddress: string,
  platformAddress: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::contracts::add_revenue_share_rule`,
    arguments: [
      tx.object(policyId),
      tx.object(policyCapId),
      tx.pure.address(athleteAddress),
      tx.pure.address(oneAddress),
      tx.pure.address(platformAddress)
    ]
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error('Adding revenue share rule failed');
  }
}
```

---

### Phase 4: seedCommand実装

```typescript
async function seedCommand(network: string) {
  printBox('🌱 Seed NFTs to Kiosk', [
    `Network: ${network}`,
    `Minting 10 NFTs...`
  ]);

  const config = loadConfig();
  const client = getClient(network);
  const keypair = getKeypair();

  if (!config.packageId || !config.adminCapId) {
    throw new Error('Please run "pnpm run deploy:devnet" first');
  }

  // 1. NFTミント
  console.log('\n🎨 Minting 10 NFTs...');
  const nftIds = await mintBatch(
    client,
    keypair,
    config.packageId,
    config.adminCapId,
    10,
    'ONE 170 Premium Ticket',
    'Superbon vs Masaaki Noiri - Full Match Access',
    'mock-blob-id-fullmatch-one170'
  );

  console.log(`✅ Minted ${nftIds.length} NFTs`);

  // 2. Kiosk作成（まだない場合）
  let kioskId = config.kioskId;
  let kioskCapId = config.kioskCapId;

  if (!kioskId) {
    console.log('\n🏪 Creating Kiosk...');
    const kioskResult = await createKiosk(client, keypair);
    kioskId = kioskResult.kioskId;
    kioskCapId = kioskResult.kioskCapId;

    console.log('✅ Kiosk created');
    console.log(`   Kiosk ID: ${kioskId}`);

    updateEnvFile({ KIOSK_ID: kioskId, KIOSK_CAP_ID: kioskCapId });
  }

  // 3. NFTをKioskにデポジット & 出品
  console.log('\n📦 Depositing and listing NFTs...');
  for (let i = 0; i < nftIds.length; i++) {
    await kioskPlaceAndList(
      client,
      keypair,
      config.packageId,
      kioskId,
      kioskCapId,
      nftIds[i],
      500_000_000
    );

    console.log(`   [${i + 1}/${nftIds.length}] Listed: ${nftIds[i].substring(0, 10)}...`);
  }

  printBox('✅ Seed Complete', [
    `Kiosk ID: ${kioskId}`,
    `NFTs listed: ${nftIds.length}`,
    `Price: 0.5 SUI each`
  ]);
}
```

---

## 4. テスト戦略

### デプロイ前テスト

```bash
# 1. Move契約テスト
pnpm run move:test
→ 9/9 passing確認

# 2. TypeScriptコンパイル
npx tsc --noEmit scripts/tool.ts
→ エラーなし確認
```

### デプロイ後テスト

```bash
# 1. デプロイ実行
pnpm run deploy:devnet
→ .env生成確認
→ Object ID確認

# 2. シード実行
pnpm run seed:devnet
→ Kiosk出品確認

# 3. Sui Explorerで確認
https://suiexplorer.com/object/${PACKAGE_ID}?network=devnet
→ Transfer Policy設定確認
→ NFT出品状況確認
```

---

## 5. 実装スケジュール

| Phase | タスク | 所要時間 |
|-------|--------|----------|
| Phase 1 | 環境セットアップ | 30分 |
| Phase 2 | tool.ts基本構造 | 1時間 |
| Phase 3 | deployCommand実装 | 2時間 |
| Phase 4 | seedCommand実装 | 1時間 |
| Phase 5 | デプロイ実行・検証 | 1時間 |
| **合計** | | **5.5時間** |

---

## 6. リスクと対策

### リスク1: Faucet失敗
**対策**:
- リトライロジック実装
- 手動でのガス取得手順をREADMEに追加

### リスク2: Object ID抽出失敗
**対策**:
- エラーメッセージ充実
- デバッグ用JSON出力

### リスク3: sui client publishのJSON出力変更
**対策**:
- 複数バージョン対応
- エラーハンドリング強化

---

## 7. 成果物

### 実装ファイル
- ✅ `scripts/tool.ts` - 完全な自動デプロイツール
- ✅ `tsconfig.json` - TypeScript設定
- ✅ `.env.example` - 環境変数テンプレート

### 生成ファイル
- ✅ `.env` - デプロイ後に自動生成

### ドキュメント
- ✅ `README.md` - デプロイ手順追加

---

## 8. 次のステップ

この実装計画が承認されたら、実装を開始します。

**実装順序:**
1. ✅ TypeScript環境セットアップ
2. ✅ tool.ts基本構造実装
3. ✅ deployCommand実装
4. ✅ seedCommand実装
5. ✅ 実際のdevnetデプロイ実行
6. ✅ README.md更新

---

**📋 実装計画作成完了**

この計画に問題がなければ、実装に進みます。
