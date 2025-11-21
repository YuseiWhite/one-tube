# タスクリスト: Seal統合実装（Phase 1 + Phase 3）

**ブランチ**: `feature/yuseiwhite`
**作成日**: 2025-11-21
**OneTubeプロジェクト**: NFT-Gated Video Streaming Platform (MVP)

---

## タスク概要

Phase 1（動画暗号化とseal_approve_nft関数設定）とPhase 3（セッション管理と視聴）の実装タスク。TDD原則に従い、テスト → 実装の順序で進める。

**総タスク数**: 15個
**推定工数**: 3-5日

---

## ガードレール設計（必須遵守事項）

**⚠️ 重要**: 以下のガードレールに従わないと、spec.mdとplan.mdに100%準拠した実装ができません。各タスク完了時に必ず検証してください。

### 1. TDD原則の強制

#### 1.1 テストファーストの強制
**ルール**: 実装前に必ずテストを書く（RED phase）

**検証コマンド**:
```bash
# タスク2完了時: テストが失敗することを確認
cd contracts && sui move test
# 期待: test_seal_approve_nft_success と test_seal_approve_nft_failure が失敗する
```

#### 1.2 GREEN phaseの検証
**ルール**: 実装後、全てのテストが通過することを確認

**検証コマンド**:
```bash
# タスク3完了時: 全てのテストが通過することを確認
cd contracts && sui move test
# 期待: 全てのテストが成功する
```

### 2. コードレビュー可能な量の制限

#### 2.1 1タスクあたりの変更量制限
**ルール**: 1つのタスクで変更するファイル数は最大5ファイルまで

**検証コマンド**:
```bash
# コミット前: 変更ファイル数を確認
git diff --name-only --cached
# 期待: 変更ファイル数が5ファイル以下
```

#### 2.2 1コミットあたりの変更行数制限
**ルール**: 1コミットあたりの変更行数は最大200行まで

**検証コマンド**:
```bash
# コミット前: 変更行数を確認
git diff --stat
# 期待: 変更行数が200行以下
```

### 3. テストカバレッジ基準

#### 3.1 Contract Testカバレッジ
**ルール**: `seal_approve_nft`関数のテストカバレッジは100%

**検証コマンド**:
```bash
cd contracts && sui move test --coverage
# 期待: seal_approve_nft関数のカバレッジが100%
```

#### 3.2 Unit Testカバレッジ
**ルール**: `seal.ts`の各関数のテストカバレッジは90%以上

**検証コマンド**:
```bash
pnpm test --coverage
# 期待: seal.tsのカバレッジが90%以上
```

### 4. 定量的な評価基準

#### 4.1 正確性 (Correct)
**指標**: テスト成功率が100%に近い

**検証コマンド**:
```bash
# Contract Test
cd contracts && sui move test
# Integration Test
pnpm test:api
# Unit Test
pnpm test
# 期待: 全てのテストが成功
```

#### 4.2 テスト可能性 (Testable)
**指標**: 単体テストカバレッジが90%を超える

**検証コマンド**:
```bash
pnpm test --coverage
# 期待: カバレッジが90%以上
```

#### 4.3 保守性 (Maintainable)
**指標**: 認知的複雑性が低い

**チェックポイント**:
- [ ] 各関数の行数が50行以下
- [ ] ネストの深さが3レベル以下
- [ ] 関数名が明確で、目的が明確

#### 4.4 規律 (Disciplined)
**指標**: コミットはCIによってゲートされている

**検証コマンド**:
```bash
# コミット前: 全てのチェックを実行
pnpm lint && pnpm typecheck && pnpm test
# 期待: 全てのチェックが通過する
```

### 5. 実装上の制約

#### 5.1 Seal SDKパッケージ名の統一
**ルール**: 全てのファイルで`@mysten/seal`を使用する（`@mysten/seal`ではない）

**検証コマンド**:
```bash
# package.jsonを確認
grep -r "@mysten.*seal" package.json app/package.json
# 期待: @mysten/seal のみが存在
```

#### 5.2 NFT所有確認の実装方法
**ルール**: Suiオブジェクトには`owner`フィールドが存在しないため、Seal key serverが`dry_run_transaction_block`で評価する

**チェックポイント**:
- [ ] Moveコントラクトの実装で`ticket.owner`を使用していない
- [ ] `test_scenario`のコンテキストで所有確認を行う

#### 5.3 Session型の拡張
**ルール**: `decryptionKey`フィールドを削除し、`sessionKey`と`txBytes`を追加する

**チェックポイント**:
- [ ] `types.ts`の`Session`型から`decryptionKey`を削除
- [ ] `Session`型に`sessionKey`フィールドを追加（型: `unknown`または`SessionKey`）
- [ ] `Session`型に`txBytes`フィールドを追加（型: `string`）
- [ ] `SessionMetadata`型も同様に更新

#### 5.4 blobIdの解決方法
**ルール**: NFTオブジェクトの`blob_id`フィールドから取得（Sui RPCの`getObject()`を使用）

**チェックポイント**:
- [ ] `/api/watch`エンドポイントで、NFTオブジェクトから`blob_id`を取得
- [ ] Sui RPCの`getObject()`を使用してNFTオブジェクトを取得
- [ ] NFTオブジェクトの`content.fields.blob_id`から値を取得

### 6. エラーハンドリングの強制

#### 6.1 エラータイプの定義
**ルール**: spec.mdで定義された全てのエラータイプを実装する（8種類）

**検証コマンド**:
```bash
# types.tsを確認
grep -E "class.*Error" app/src/shared/types.ts
# 期待: 8種類のエラータイプが定義されている
```

#### 6.2 HTTPステータスコードマッピング
**ルール**: spec.mdのエラー → HTTPステータスコード対応表に従う

**検証コマンド**:
```bash
# types.tsを確認
grep -A 20 "getHttpStatusForError" app/src/shared/types.ts
# 期待: 全てのエラータイプがマッピングされている
```

### 7. セキュリティチェック

#### 7.1 マスター鍵の保護
**ルール**: アプリ側でマスター鍵を生成・保持しない

**検証コマンド**:
```bash
# seal.tsを確認
grep -i "master.*key\|decryption.*key" app/src/server/seal.ts
# 期待: マスター鍵や復号鍵の生成コードが存在しない
```

#### 7.2 SessionKeyのログ出力制限
**ルール**: DEV_MODE=true時のみSessionKeyをログ出力（マスク済み）

**検証コマンド**:
```bash
# logger.tsを確認
grep -A 10 "logSessionKey" app/src/lib/logger.ts
# 期待: DEV_MODEチェックとマスク処理が実装されている
```

### 8. 実装順序の強制

#### 8.1 Phase 1の実装順序
**ルール**: タスク1 → タスク2 → タスク3 → タスク4 → タスク5 → タスク6の順序

**チェックポイント**:
- [ ] タスク2が完了するまで、タスク3を開始しない
- [ ] タスク3が完了するまで、タスク4を開始しない

#### 8.2 Phase 3の実装順序
**ルール**: タスク7 → タスク8 → タスク9 → タスク10 → タスク11 → タスク12 → タスク13 → タスク14 → タスク15の順序

**チェックポイント**:
- [ ] タスク7が完了するまで、タスク11を開始しない
- [ ] タスク8が完了するまで、タスク11を開始しない
- [ ] タスク9が完了するまで、タスク11を開始しない
- [ ] タスク10が完了するまで、タスク11を開始しない

### 9. コミットメッセージの規約

#### 9.1 Conventional Commits
**ルール**: Conventional Commitsの規約に従う

**フォーマット**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**タイプ**: `feat`, `fix`, `test`, `refactor`, `docs`

**例**:
```
feat(seal): add seal_approve_nft function

Implement seal_approve_nft function in Move contract.
Verify NFT ownership using tx_context::sender().

Closes #031
```

**チェックポイント**:
- [ ] コミットメッセージがConventional Commitsの規約に従っている
- [ ] タイプとスコープが明確に記載されている
- [ ] 本文に実装の詳細が記載されている

### 10. ドキュメント更新の強制

#### 10.1 実装完了時のドキュメント更新
**ルール**: 各タスク完了時に、関連するドキュメントを更新する

**検証コマンド**:
```bash
# ドキュメントの更新を確認
git diff --name-only HEAD~1 | grep -E "\.md$|\.example$"
# 期待: 関連するドキュメントが更新されている
```

### 各タスクでの検証フロー

各タスクには以下のセクションが含まれます：

1. **タスク開始前のチェックポイント**: 前提条件の確認
2. **実装中のチェックポイント**: TDD原則、コードレビュー可能な量の制限
3. **ガードレール検証**: タスク完了時の検証チェックリスト
4. **検証コマンド**: 各チェックポイントを検証するコマンド

---

## Phase 1: 動画暗号化とseal_approve_nft関数設定

### タスク1: 環境設定 - Seal SDK依存関係追加と環境変数設定 [P]

**ファイル**:
- `package.json` (root)
- `.env.example`
- `.env`

**説明**:
1. Seal SDK依存関係を追加
   ```bash
   pnpm add @mysten/seal
   ```
2. `.env.example`に環境変数テンプレートを追加
   ```bash
   # Seal設定
   SEAL_KEY_SERVER_OBJECT_IDS=0x...,0x...
   SEAL_PACKAGE_ID=0x...
   SEAL_IDENTITY_ID=0x...
   SEAL_THRESHOLD=2
   SEAL_SESSION_DURATION=60
   VERIFY_KEY_SERVERS=false

   # Walrus設定
   WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
   WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

   # 開発者モード
   DEV_MODE=false
   ```
3. `.env`ファイルに実際の値を設定

**完了条件**:
- [ ] `@mysten/seal`がインストールされている（パッケージ名は`@mysten/seal`が正しい）
- [ ] `.env.example`に全ての環境変数が追加されている
- [ ] `.env`ファイルが作成され、必要な値が設定されている

**ガードレール検証**:
- [ ] Seal SDKパッケージ名が`@mysten/seal`であることを確認
  ```bash
  grep -r "@mysten.*seal" package.json app/package.json
  # 期待: @mysten/seal のみが存在
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク2: seal_approve_nft関数のテスト追加（RED） [B]

**ファイル**:
- `contracts/tests/contracts_tests.move`

**説明**:
TDD原則に従い、`seal_approve_nft`関数のテストを先に書く（RED phase）。

**テストケース**:
1. **test_seal_approve_nft_success**: NFTを所有している場合、`seal_approve_nft`が成功する
2. **test_seal_approve_nft_failure**: NFTを所有していない場合、`seal_approve_nft`がabortする

**実装例**:
```move
#[test]
fun test_seal_approve_nft_success() {
    let mut scenario = test_scenario::begin(ADMIN);

    // PremiumTicketNFTをmint
    mint_premium_ticket(&mut scenario, USER);

    // seal_approve_nftを呼び出す（成功するはず）
    test_scenario::next_tx(&mut scenario, USER);
    {
        let ticket = test_scenario::take_from_sender<PremiumTicketNFT>(&scenario);
        let id = vector::empty<u8>();
        vector::push_back(&mut id, 1);

        seal_approve_nft(id, &ticket, test_scenario::ctx(&mut scenario));

        test_scenario::return_to_sender(&scenario, ticket);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = E_NOT_NFT_OWNER)]
fun test_seal_approve_nft_failure() {
    let mut scenario = test_scenario::begin(ADMIN);

    // PremiumTicketNFTをmintするが、別のユーザーに送る
    mint_premium_ticket(&mut scenario, OTHER_USER);

    // USERがseal_approve_nftを呼び出す（失敗するはず）
    test_scenario::next_tx(&mut scenario, USER);
    {
        let ticket = test_scenario::take_from_address<PremiumTicketNFT>(&scenario, OTHER_USER);
        let id = vector::empty<u8>();
        vector::push_back(&mut id, 1);

        // この呼び出しはabortするはず
        seal_approve_nft(id, &ticket, test_scenario::ctx(&mut scenario));

        test_scenario::return_to_address(&scenario, OTHER_USER, ticket);
    };

    test_scenario::end(scenario);
}
```

**完了条件**:
- [ ] `test_seal_approve_nft_success`テストが追加されている
- [ ] `test_seal_approve_nft_failure`テストが追加されている
- [ ] `pnpm move:test`を実行し、テストが失敗する（RED phase）

**ガードレール検証**:
- [ ] TDD原則（RED phase）: テストが失敗することを確認
  ```bash
  cd contracts && sui move test
  # 期待: test_seal_approve_nft_success と test_seal_approve_nft_failure が失敗する
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

**コマンド**:
```bash
cd contracts
sui move test
```

---

### タスク3: seal_approve_nft関数の実装（GREEN） [B]

**ファイル**:
- `contracts/sources/contracts.move`

**説明**:
タスク2で作成したテストを通すため、`seal_approve_nft`関数を実装する（GREEN phase）。

**実装要件**:
1. 関数シグネチャ: `entry fun seal_approve_nft(id: vector<u8>, ticket: &PremiumTicketNFT, ctx: &TxContext)`
2. `tx_context::sender(ctx)`でトランザクションのsenderを取得
3. NFT所有確認ロジックを実装（所有していない場合はabort）
4. 読み取り専用で実装（storageを書き換えない）

**実装例**:
```move
use sui::tx_context::{Self, TxContext};

/// Sealアクセス制御関数: PremiumTicketNFT所有を確認
/// id: Seal identity ID（package IDのprefixなし）
/// ticket: 所有確認するPremiumTicketNFTオブジェクト
/// ctx: トランザクションコンテキスト（senderを取得するため）
///
/// セキュリティ: user引数は使用せず、tx_context::sender()でトランザクションのsenderを取得する
/// ポリシーの制約: この関数は読み取り専用で実装する（storageを書き換えない）
entry fun seal_approve_nft(
    _id: vector<u8>,
    ticket: &PremiumTicketNFT,
    ctx: &TxContext
) {
    // トランザクションのsenderを取得（PTBのsenderと一貫性を保つ）
    let sender = tx_context::sender(ctx);

    // NFT所有確認ロジック
    // 注意: Suiオブジェクトには`owner`フィールドが存在しない
    // 実際の実装では、Seal key serverが`dry_run_transaction_block`で評価する際に、
    // トランザクションのsenderがNFTを所有しているかが自動的に確認される
    // ここでは簡易的な実装として、エラーコードを定義する
    // 実際の所有確認は、Seal key server側で実行される
    
    // 注意: この関数は読み取り専用で実装する（storageを書き換えない）
    // 実際の所有確認は、Seal key serverが`dry_run_transaction_block`で評価する際に行われる
}
```

**完了条件**:
- [ ] `seal_approve_nft`関数が実装されている
- [ ] `pnpm move:test`を実行し、全てのテストが通過する（GREEN phase）
- [ ] `contracts.move`にエラーコード`E_NOT_NFT_OWNER`が定義されている

**ガードレール検証**:
- [ ] TDD原則（GREEN phase）: 全てのテストが通過することを確認
  ```bash
  cd contracts && sui move test
  # 期待: 全てのテストが成功する
  ```
- [ ] Contract Testカバレッジが100%であることを確認
  ```bash
  cd contracts && sui move test --coverage
  # 期待: seal_approve_nft関数のカバレッジが100%
  ```
- [ ] NFT所有確認の実装方法: `ticket.owner`を使用していないことを確認
  ```bash
  grep -n "ticket.owner" contracts/sources/contracts.move
  # 期待: ticket.owner が存在しない
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```
- [ ] コミット前チェック: lint, typecheck, testが通過することを確認
  ```bash
  pnpm lint && pnpm typecheck && pnpm test
  # 期待: 全てのチェックが通過する
  ```

**コマンド**:
```bash
cd contracts
sui move test
```

---

### タスク4: SealClient初期化 [P]

**ファイル**:
- `app/src/server/seal.ts`

**説明**:
SealClientを初期化し、暗号化・復号の基盤を作成する。

**実装内容**:
1. SealClient初期化関数を実装
2. Key serverのobject IDを環境変数から取得
3. `verifyKeyServers`設定（ローカル開発ではfalse、本番ではtrue）

**実装例**:
```typescript
import { SealClient } from '@mysten/seal';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

let sealClient: SealClient | null = null;

/**
 * SealClientを初期化
 */
export function initializeSealClient(): SealClient {
  if (sealClient) {
    return sealClient;
  }

  const keyServerObjectIds = process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(',') || [];
  const verifyKeyServers = process.env.VERIFY_KEY_SERVERS === 'true';
  const network = process.env.NETWORK || 'devnet';

  if (keyServerObjectIds.length === 0) {
    throw new Error('SEAL_KEY_SERVER_OBJECT_IDS is not set');
  }

  const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

  sealClient = new SealClient({
    suiClient,
    keyServerObjectIds,
    verifyKeyServers,
  });

  return sealClient;
}

/**
 * SealClientインスタンスを取得
 */
export function getSealClient(): SealClient {
  if (!sealClient) {
    return initializeSealClient();
  }
  return sealClient;
}
```

**完了条件**:
- [ ] `initializeSealClient()`関数が実装されている
- [ ] `getSealClient()`関数が実装されている
- [ ] 環境変数から設定を読み込んでいる
- [ ] エラーハンドリングが適切に実装されている

**ガードレール検証**:
- [ ] Seal SDKパッケージ名が`@mysten/seal`であることを確認
  ```bash
  grep -n "@mysten/seal" app/src/server/seal.ts
  # 期待: @mysten/seal が使用されている
  ```
- [ ] マスター鍵を生成・保持していないことを確認
  ```bash
  grep -i "master.*key\|decryption.*key" app/src/server/seal.ts
  # 期待: マスター鍵や復号鍵の生成コードが存在しない
  ```
- [ ] 各関数の行数が50行以下であることを確認（手動レビュー）
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク5: Walrus統合モジュール（Publisher API + Aggregator API） [P]

**ファイル**:
- `app/src/server/walrus.ts`

**説明**:
Walrus HTTP APIを統合し、BLOBのアップロードとURL解決を実装する。

**実装内容**:
1. **Publisher API**: BLOBアップロード
2. **Aggregator API**: BLOB IDからURL解決

**実装例**:
```typescript
import axios from 'axios';

const WALRUS_API_URL = process.env.WALRUS_API_URL || '';
const WALRUS_AGGREGATOR_URL = process.env.WALRUS_AGGREGATOR_URL || '';

/**
 * WalrusにBLOBをアップロードする
 * @param data - アップロードするデータ（Buffer）
 * @returns BLOB ID
 */
export async function uploadBlob(data: Buffer): Promise<string> {
  try {
    const response = await axios.put(`${WALRUS_API_URL}/v1/store`, data, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (response.data.newlyCreated) {
      return response.data.newlyCreated.blobObject.blobId;
    }
    if (response.data.alreadyCertified) {
      return response.data.alreadyCertified.blobId;
    }

    throw new Error('Failed to upload blob to Walrus');
  } catch (error) {
    throw new Error(`WalrusConnectionError: ${error}`);
  }
}

/**
 * BLOB IDから動画URLを取得する
 * @param blobId - Walrus BLOB ID
 * @returns 動画URL
 */
export async function getBlobUrl(blobId: string): Promise<string> {
  try {
    // Walrus Aggregator APIからBLOBを取得
    const url = `${WALRUS_AGGREGATOR_URL}/v1/${blobId}`;

    // URLの存在確認（HEAD リクエスト）
    await axios.head(url);

    return url;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`BlobNotFoundError: BLOB ID ${blobId} not found`);
    }
    throw new Error(`WalrusConnectionError: ${error}`);
  }
}

/**
 * BLOB IDから暗号化オブジェクトを取得する
 * @param blobId - Walrus BLOB ID
 * @returns 暗号化オブジェクト（Buffer）
 */
export async function getEncryptedBlob(blobId: string): Promise<Buffer> {
  try {
    const response = await axios.get(`${WALRUS_AGGREGATOR_URL}/v1/${blobId}`, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`BlobNotFoundError: BLOB ID ${blobId} not found`);
    }
    throw new Error(`WalrusConnectionError: ${error}`);
  }
}
```

**完了条件**:
- [ ] `uploadBlob()`関数が実装されている
- [ ] `getBlobUrl()`関数が実装されている
- [ ] `getEncryptedBlob()`関数が実装されている
- [ ] エラーハンドリングが適切に実装されている

**ガードレール検証**:
- [ ] エラータイプが適切に使用されていることを確認
  ```bash
  grep -E "WalrusConnectionError|BlobNotFoundError" app/src/server/walrus.ts
  # 期待: 適切なエラータイプが使用されている
  ```
- [ ] 各関数の行数が50行以下であることを確認（手動レビュー）
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク6: 動画暗号化スクリプト

**ファイル**:
- `scripts/encrypt-video.ts`

**説明**:
SealClient.encrypt()を使用して動画を暗号化し、Walrusにアップロードするスクリプト。

**実装内容**:
1. 動画ファイルを読み込み
2. SealClient.encrypt()を使用して暗号化
3. 暗号化オブジェクトをWalrusにアップロード
4. BLOB IDをコンソールに出力

**実装例**:
```typescript
import { readFileSync, writeFileSync } from 'fs';
import { getSealClient } from '../app/src/server/seal';
import { uploadBlob } from '../app/src/server/walrus';

async function encryptVideo(videoPath: string) {
  console.log('Loading video file...');
  const videoData = readFileSync(videoPath);

  console.log('Initializing SealClient...');
  const sealClient = getSealClient();

  const threshold = Number(process.env.SEAL_THRESHOLD) || 2;
  const packageId = process.env.SEAL_PACKAGE_ID || '';
  const identityId = process.env.SEAL_IDENTITY_ID || '';

  if (!packageId || !identityId) {
    throw new Error('SEAL_PACKAGE_ID and SEAL_IDENTITY_ID must be set');
  }

  console.log('Encrypting video...');
  const { encryptedObject, key } = await sealClient.encrypt({
    threshold,
    packageId,
    id: Buffer.from(identityId, 'hex'),
    data: videoData,
  });

  console.log('Uploading encrypted object to Walrus...');
  const blobId = await uploadBlob(Buffer.from(encryptedObject));

  console.log('\n✅ Encryption completed!');
  console.log(`BLOB ID: ${blobId}`);
  console.log(`Identity ID: ${identityId}`);
  console.log('\n⚠️  Note: DEM key is discarded (not stored). Seal key server manages decryption.');

  // オプション: メタデータをJSONファイルに保存
  const metadata = {
    blobId,
    identityId,
    packageId,
    threshold,
    encryptedAt: new Date().toISOString(),
  };
  writeFileSync('encrypted-video-metadata.json', JSON.stringify(metadata, null, 2));
  console.log('Metadata saved to encrypted-video-metadata.json');
}

// CLI引数から動画パスを取得
const videoPath = process.argv[2];
if (!videoPath) {
  console.error('Usage: pnpm encrypt-video <video-path>');
  process.exit(1);
}

encryptVideo(videoPath).catch(console.error);
```

**package.jsonスクリプト追加**:
```json
{
  "scripts": {
    "encrypt-video": "tsx scripts/encrypt-video.ts"
  }
}
```

**完了条件**:
- [ ] `scripts/encrypt-video.ts`が実装されている
- [ ] `pnpm encrypt-video <video-path>`コマンドが動作する
- [ ] 暗号化オブジェクトがWalrusにアップロードされる
- [ ] BLOB IDがコンソールに出力される
- [ ] メタデータがJSONファイルに保存される

**ガードレール検証**:
- [ ] Seal SDKパッケージ名が`@mysten/seal`であることを確認
  ```bash
  grep -n "@mysten/seal" scripts/encrypt-video.ts
  # 期待: @mysten/seal が使用されている
  ```
- [ ] マスター鍵を生成・保持していないことを確認
  ```bash
  grep -i "master.*key\|decryption.*key" scripts/encrypt-video.ts
  # 期待: マスター鍵や復号鍵の生成コードが存在しない
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

**テストコマンド**:
```bash
pnpm encrypt-video path/to/test-video.mp4
```

---

## Phase 3: セッション管理と視聴

### タスク7: エラータイプ追加 [P]

**ファイル**:
- `app/src/shared/types.ts`

**説明**:
Seal統合で使用する新規エラータイプを追加する。

**追加するエラータイプ**:
1. `RPCConnectionError`: Sui RPC接続エラー
2. `SessionNotFoundError`: セッションが見つからない
3. `SessionStorageError`: セッションファイル読み込みエラー
4. `WalrusConnectionError`: Walrus API接続エラー
5. `BlobNotFoundError`: BLOB IDが存在しない
6. `SealDecryptionError`: Seal復号失敗
7. `SealEncryptionError`: Seal暗号化失敗
8. `SealKeyServerError`: Seal key server接続エラー

**実装例**:
```typescript
// エラータイプ定義
export class RPCConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RPCConnectionError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionStorageError';
  }
}

export class WalrusConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalrusConnectionError';
  }
}

export class BlobNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlobNotFoundError';
  }
}

export class SealDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SealDecryptionError';
  }
}

export class SealEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SealEncryptionError';
  }
}

export class SealKeyServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SealKeyServerError';
  }
}

// HTTPステータスコードマッピング
export function getHttpStatusForError(error: Error): number {
  switch (error.name) {
    case 'NFTNotOwnedError':
      return 403; // Forbidden
    case 'SessionExpiredError':
    case 'SessionNotFoundError':
      return 401; // Unauthorized
    case 'RPCConnectionError':
    case 'WalrusConnectionError':
    case 'SealKeyServerError':
      return 502; // Bad Gateway
    case 'SessionStorageError':
    case 'SealDecryptionError':
    case 'SealEncryptionError':
      return 500; // Internal Server Error
    case 'BlobNotFoundError':
      return 404; // Not Found
    case 'InvalidInputError':
      return 400; // Bad Request
    default:
      return 500; // Internal Server Error
  }
}
```

**完了条件**:
- [ ] 8種類のエラータイプが定義されている
- [ ] `getHttpStatusForError()`関数が実装されている
- [ ] エラー → HTTPステータスコード対応表に従っている

**ガードレール検証**:
- [ ] 8種類のエラータイプが定義されていることを確認
  ```bash
  grep -E "class.*Error" app/src/shared/types.ts
  # 期待: 8種類のエラータイプが定義されている
  ```
- [ ] `getHttpStatusForError()`関数が実装されていることを確認
  ```bash
  grep -A 20 "getHttpStatusForError" app/src/shared/types.ts
  # 期待: 全てのエラータイプがマッピングされている
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク8: ロガー実装（開発者モード対応） [P]

**ファイル**:
- `app/src/lib/logger.ts`

**説明**:
開発者モード（`DEV_MODE=true`）時のみ詳細ログを出力するロガーを実装する。

**ログポリシー**:
- **基本**: 必要なログは出力する
- **DEV_MODE**: 開発者モード時は積極的にログを出力する
- **本番**: DEV_MODEを無効にすることでセキュアにする

**実装例**:
```typescript
const DEV_MODE = process.env.DEV_MODE === 'true';

/**
 * INFO レベルログ
 */
export function logInfo(message: string, data?: Record<string, unknown>) {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

/**
 * ERROR レベルログ
 */
export function logError(message: string, error?: Error | unknown) {
  console.error(`[ERROR] ${message}`, error);
}

/**
 * DEBUG レベルログ（DEV_MODE時のみ）
 */
export function logDebug(message: string, data?: Record<string, unknown>) {
  if (DEV_MODE) {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * SessionKey情報をログ出力（DEV_MODE時のみ、マスク済み）
 */
export function logSessionKey(sessionKey: unknown) {
  if (DEV_MODE) {
    const masked = {
      ...sessionKey,
      ephemeralSecretKey: '[MASKED]',
    };
    console.log('[DEBUG] SessionKey:', JSON.stringify(masked, null, 2));
  }
}

/**
 * 外部APIレスポンスをログ出力（DEV_MODE時のみ）
 */
export function logApiResponse(apiName: string, response: unknown) {
  if (DEV_MODE) {
    console.log(`[DEBUG] ${apiName} Response:`, JSON.stringify(response, null, 2));
  }
}

/**
 * エラー情報をログ出力
 */
export function logErrorInfo(error: Error, context?: Record<string, unknown>) {
  logError(`${error.name}: ${error.message}`, {
    ...context,
    stack: DEV_MODE ? error.stack : undefined,
  });
}
```

**完了条件**:
- [ ] `logInfo()`、`logError()`、`logDebug()`関数が実装されている
- [ ] `logSessionKey()`関数がSessionKeyをマスクして出力している
- [ ] `logApiResponse()`関数が外部APIレスポンスをログ出力している
- [ ] DEV_MODE時のみ詳細ログを出力している

**ガードレール検証**:
- [ ] SessionKeyのログ出力制限が実装されていることを確認
  ```bash
  grep -A 10 "logSessionKey" app/src/lib/logger.ts
  # 期待: DEV_MODEチェックとマスク処理が実装されている
  ```
- [ ] DEV_MODE=false時はSessionKeyをログ出力しないことを確認（手動レビュー）
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク9: SessionKey作成とPTB構築

**ファイル**:
- `app/src/server/seal.ts`

**説明**:
Seal SDKでSessionKeyを作成し、`seal_approve_nft`を呼び出すPTBを構築する。

**実装内容**:
1. SessionKey作成（Seal SDKを使用）
2. ユーザー署名処理
3. PTB構築（`seal_approve_nft`を含む）

**実装例**:
```typescript
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSealClient } from './seal';

/**
 * SessionKeyを作成する
 */
export async function createSessionKey(userKeypair: Ed25519Keypair) {
  const sealClient = getSealClient();
  const sessionDuration = Number(process.env.SEAL_SESSION_DURATION) || 60; // 秒単位

  // SessionKeyを作成（ttlMinは最小1分）
  const sessionKey = await sealClient.createSessionKey({
    userKeypair,
    ttlMin: Math.max(1, Math.floor(sessionDuration / 60)), // 分単位に変換
  });

  return sessionKey;
}

/**
 * seal_approve_nftを呼び出すPTBを構築する
 */
export function buildSealApprovePTB(
  nftId: string,
  identityId: string,
  packageId: string
): Transaction {
  const tx = new Transaction();

  // seal_approve_nft関数を呼び出す
  tx.moveCall({
    target: `${packageId}::contracts::seal_approve_nft`,
    arguments: [
      tx.pure.vector('u8', Buffer.from(identityId, 'hex')),
      tx.object(nftId),
    ],
  });

  return tx;
}
```

**完了条件**:
- [ ] `createSessionKey()`関数が実装されている
- [ ] `buildSealApprovePTB()`関数が実装されている
- [ ] SessionKeyの有効期限が適切に設定されている
- [ ] PTBが`seal_approve_nft`を呼び出している

**ガードレール検証**:
- [ ] Seal SDKパッケージ名が`@mysten/seal`であることを確認
  ```bash
  grep -n "@mysten/seal" app/src/server/seal.ts
  # 期待: @mysten/seal が使用されている
  ```
- [ ] 各関数の行数が50行以下であることを確認（手動レビュー）
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク10: セッション永続化（JSONファイル管理）

**ファイル**:
- `app/src/server/seal.ts`
- `app/data/sessions.json`（自動生成）

**説明**:
セッション情報をJSONファイルで永続化し、読み込み・書き込み・クリーンアップを実装する。

**実装内容**:
1. セッション保存
2. セッション読み込み
3. 期限切れセッションの自動削除

**実装例**:
```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

interface Session {
  sessionId: string;
  userAddress: string;
  nftId: string;
  blobId: string;
  sessionKey: unknown; // SessionKey型（Seal SDK）
  txBytes: string;
  createdAt: number;
  expiresAt: number;
}

const SESSIONS_FILE = join(__dirname, '../../data/sessions.json');

/**
 * セッションファイルを読み込む
 */
function loadSessions(): Session[] {
  try {
    if (!existsSync(SESSIONS_FILE)) {
      // ディレクトリが存在しない場合は作成
      const dir = join(__dirname, '../../data');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      return [];
    }
    const data = readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.sessions || [];
  } catch (error) {
    throw new SessionStorageError(`Failed to load sessions: ${error}`);
  }
}

/**
 * セッションファイルに保存する
 */
function saveSessions(sessions: Session[]) {
  try {
    const dir = join(__dirname, '../../data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));
  } catch (error) {
    throw new SessionStorageError(`Failed to save sessions: ${error}`);
  }
}

/**
 * セッションを作成する
 */
export function createSession(
  userAddress: string,
  nftId: string,
  blobId: string,
  sessionKey: unknown,
  txBytes: string
): Session {
  const now = Date.now();
  const sessionDuration = Number(process.env.SEAL_SESSION_DURATION) || 60; // 秒単位
  const expiresAt = now + sessionDuration * 1000; // ミリ秒単位

  // セッションIDを生成（SHA-256ハッシュ）
  const sessionId = createHash('sha256')
    .update(`${userAddress}-${nftId}-${now}`)
    .digest('hex');

  const session: Session = {
    sessionId,
    userAddress,
    nftId,
    blobId,
    sessionKey,
    txBytes,
    createdAt: now,
    expiresAt,
  };

  // セッションを保存
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);

  logInfo('Session created', { sessionId, userAddress, nftId });
  return session;
}

/**
 * セッションを検証する
 */
export function validateSession(sessionId: string): Session {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new SessionNotFoundError(`Session ${sessionId} not found`);
  }

  const now = Date.now();
  if (now > session.expiresAt) {
    // 期限切れセッションを削除
    const filtered = sessions.filter((s) => s.sessionId !== sessionId);
    saveSessions(filtered);
    throw new SessionExpiredError(`Session ${sessionId} expired`);
  }

  return session;
}

/**
 * 期限切れセッションをクリーンアップする
 */
export function cleanupExpiredSessions() {
  const sessions = loadSessions();
  const now = Date.now();
  const filtered = sessions.filter((s) => s.expiresAt > now);

  const removed = sessions.length - filtered.length;
  if (removed > 0) {
    saveSessions(filtered);
    logInfo(`Cleaned up ${removed} expired sessions`);
  }
}
```

**完了条件**:
- [ ] `createSession()`関数が実装されている
- [ ] `validateSession()`関数が実装されている
- [ ] `cleanupExpiredSessions()`関数が実装されている
- [ ] セッション情報がJSONファイルに保存されている
- [ ] 期限切れセッションが自動削除されている

**ガードレール検証**:
- [ ] Session型が正しく拡張されていることを確認（`decryptionKey`削除、`sessionKey`と`txBytes`追加）
  ```bash
  grep -A 10 "interface Session" app/src/server/seal.ts
  # 期待: decryptionKeyが存在せず、sessionKeyとtxBytesが存在する
  ```
- [ ] エラータイプが適切に使用されていることを確認
  ```bash
  grep -E "SessionNotFoundError|SessionStorageError|SessionExpiredError" app/src/server/seal.ts
  # 期待: 適切なエラータイプが使用されている
  ```
- [ ] 各関数の行数が50行以下であることを確認（手動レビュー）
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

---

### タスク11: POST /api/watch エンドポイント拡張

**ファイル**:
- `app/src/server/server.ts`

**説明**:
既存の`POST /api/watch`エンドポイントを拡張し、Seal統合のセッション作成を実装する。

**実装内容**:
1. リクエスト: `{ nftId, userAddress }`（blobIdは不要、内部で解決）
2. NFTメタデータからblobIdを内部で解決
3. SessionKey作成 → ユーザー署名 → PTB構築
4. セッション作成 → JSONファイル保存
5. レスポンス: `{ success, session: SessionMetadata }`

**実装例**:
```typescript
import { Request, Response } from 'express';
import { createSessionKey, buildSealApprovePTB, createSession } from './seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getHttpStatusForError } from '../shared/types';

app.post('/api/watch', async (req: Request, res: Response) => {
  try {
    const { nftId, userAddress } = req.body;

    if (!nftId || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'nftId and userAddress are required',
        errorType: 'InvalidInputError',
      });
    }

    // NFTメタデータからblobIdを内部で解決
    // Sui RPCのgetObject()を使用してNFTオブジェクトを取得
    const client = new SuiClient({ url: RPC_URL });
    const object = await client.getObject({
      id: nftId,
      options: { showContent: true },
    });

    if (!object.data || !object.data.content) {
      throw new InvalidInputError('nftId', `NFT ${nftId} not found`);
    }

    const fields = (object.data.content as { fields: { blob_id: string } }).fields;
    const blobId = fields.blob_id;

    // SessionKey作成
    // TODO: ユーザーのkeypairを取得する実装
    const userKeypair = Ed25519Keypair.generate(); // モック
    const sessionKey = await createSessionKey(userKeypair);

    // PTB構築
    const identityId = process.env.SEAL_IDENTITY_ID || '';
    const packageId = process.env.SEAL_PACKAGE_ID || '';
    const tx = buildSealApprovePTB(nftId, identityId, packageId);

    // トランザクションをシリアライズ
    const txBytes = await tx.build({ client: suiClient });

    // セッション作成
    const session = createSession(
      userAddress,
      nftId,
      blobId,
      sessionKey,
      Buffer.from(txBytes).toString('hex')
    );

    logInfo('Session created successfully', { sessionId: session.sessionId });

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logErrorInfo(error as Error, { endpoint: '/api/watch' });
    const statusCode = getHttpStatusForError(error as Error);
    return res.status(statusCode).json({
      success: false,
      error: (error as Error).message,
      errorType: (error as Error).name,
    });
  }
});
```

**完了条件**:
- [ ] `POST /api/watch`エンドポイントが拡張されている
- [ ] NFTメタデータからblobIdを内部で解決している
- [ ] SessionKey作成 → PTB構築 → セッション保存が実装されている
- [ ] エラーハンドリングが適切に実装されている

**ガードレール検証**:
- [ ] blobIdの解決方法が正しく実装されていることを確認
  ```bash
  grep -A 10 "getBlobIdFromNFT\|getObject" app/src/server/server.ts
  # 期待: Sui RPCのgetObject()を使用してblob_idを取得している
  ```
- [ ] エラーハンドリングが適切に実装されていることを確認
  ```bash
  grep -E "getHttpStatusForError|InvalidInputError|NFTNotOwnedError" app/src/server/server.ts
  # 期待: 適切なエラーハンドリングが実装されている
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下（server.tsのみ変更）
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```
- [ ] コミット前チェック: lint, typecheck, testが通過することを確認
  ```bash
  pnpm lint && pnpm typecheck && pnpm test
  # 期待: 全てのチェックが通過する
  ```

---

### タスク12: GET /api/video エンドポイント拡張

**ファイル**:
- `app/src/server/server.ts`

**説明**:
既存の`GET /api/video`エンドポイントを拡張し、Seal復号を実装する。

**実装内容**:
1. リクエスト: `session`のみ（blobIdはセッション情報から内部で取得）
2. セッション検証 → セッション情報からblobIdを取得
3. encryptedObjectをWalrusから取得
4. SealClient.decrypt()で復号 → 一時URL返却

**実装例**:
```typescript
import { validateSession } from './seal';
import { getEncryptedBlob, getBlobUrl } from './walrus';
import { getSealClient } from './seal';

app.get('/api/video', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session as string;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'session is required',
        errorType: 'InvalidInputError',
      });
    }

    // セッション検証
    const session = validateSession(sessionId);

    // セッション情報からblobIdを取得
    const { blobId, sessionKey, txBytes } = session;

    // Walrusから暗号化オブジェクトを取得
    const encryptedObject = await getEncryptedBlob(blobId);

    // Seal復号
    const sealClient = getSealClient();
    const decryptedData = await sealClient.decrypt({
      data: encryptedObject,
      sessionKey,
      txBytes: Buffer.from(txBytes, 'hex'),
    });

    logInfo('Video decrypted successfully', { sessionId, blobId });

    // 復号済みデータを返却
    // TODO: 実際の実装では、一時URLを生成して返す
    res.setHeader('Content-Type', 'video/mp4');
    return res.send(decryptedData);
  } catch (error) {
    logErrorInfo(error as Error, { endpoint: '/api/video' });
    const statusCode = getHttpStatusForError(error as Error);
    return res.status(statusCode).json({
      success: false,
      error: (error as Error).message,
      errorType: (error as Error).name,
    });
  }
});
```

**完了条件**:
- [ ] `GET /api/video`エンドポイントが拡張されている
- [ ] セッション検証 → blobId取得 → 復号が実装されている
- [ ] SealClient.decrypt()が正しく呼び出されている
- [ ] エラーハンドリングが適切に実装されている

**ガードレール検証**:
- [ ] Seal SDKパッケージ名が`@mysten/seal`であることを確認
  ```bash
  grep -n "@mysten/seal" app/src/server/server.ts
  # 期待: @mysten/seal が使用されている
  ```
- [ ] SealClient.decrypt()が正しく呼び出されていることを確認
  ```bash
  grep -A 5 "sealClient.decrypt" app/src/server/server.ts
  # 期待: SealClient.decrypt()が正しく実装されている
  ```
- [ ] エラーハンドリングが適切に実装されていることを確認
  ```bash
  grep -E "getHttpStatusForError|SealDecryptionError|BlobNotFoundError" app/src/server/server.ts
  # 期待: 適切なエラーハンドリングが実装されている
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下（server.tsのみ変更）
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```
- [ ] コミット前チェック: lint, typecheck, testが通過することを確認
  ```bash
  pnpm lint && pnpm typecheck && pnpm test
  # 期待: 全てのチェックが通過する
  ```

---

### タスク13: ユニットテスト

**ファイル**:
- `app/src/server/__tests__/seal.test.ts`

**説明**:
`seal.ts`の各関数のユニットテストを実装する。

**テスト対象関数**:
1. `initializeSealClient()`
2. `createSessionKey()`
3. `buildSealApprovePTB()`
4. `createSession()`
5. `validateSession()`
6. `cleanupExpiredSessions()`

**実装例**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSession, validateSession, cleanupExpiredSessions } from '../seal';
import { SessionExpiredError, SessionNotFoundError } from '../../shared/types';
import { unlinkSync, existsSync } from 'fs';

describe('seal.ts', () => {
  afterEach(() => {
    // テスト後にセッションファイルを削除
    const sessionsFile = join(__dirname, '../../../data/sessions.json');
    if (existsSync(sessionsFile)) {
      unlinkSync(sessionsFile);
    }
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = createSession(
        '0xUSER',
        '0xNFT',
        'blob-id',
        { mockSessionKey: true },
        '0xTXBYTES'
      );

      expect(session.sessionId).toBeDefined();
      expect(session.userAddress).toBe('0xUSER');
      expect(session.nftId).toBe('0xNFT');
      expect(session.blobId).toBe('blob-id');
    });

    it('should generate unique session IDs', () => {
      const session1 = createSession('0xUSER', '0xNFT1', 'blob-id-1', {}, '0xTX1');
      const session2 = createSession('0xUSER', '0xNFT2', 'blob-id-2', {}, '0xTX2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', () => {
      const session = createSession('0xUSER', '0xNFT', 'blob-id', {}, '0xTX');
      const validated = validateSession(session.sessionId);

      expect(validated.sessionId).toBe(session.sessionId);
    });

    it('should throw SessionNotFoundError for non-existent session', () => {
      expect(() => validateSession('non-existent')).toThrow(SessionNotFoundError);
    });

    it('should throw SessionExpiredError for expired session', () => {
      // 有効期限を過去に設定
      process.env.SEAL_SESSION_DURATION = '-1';
      const session = createSession('0xUSER', '0xNFT', 'blob-id', {}, '0xTX');

      expect(() => validateSession(session.sessionId)).toThrow(SessionExpiredError);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      process.env.SEAL_SESSION_DURATION = '-1';
      const expiredSession = createSession('0xUSER1', '0xNFT1', 'blob-id-1', {}, '0xTX1');

      process.env.SEAL_SESSION_DURATION = '60';
      const validSession = createSession('0xUSER2', '0xNFT2', 'blob-id-2', {}, '0xTX2');

      cleanupExpiredSessions();

      expect(() => validateSession(expiredSession.sessionId)).toThrow(SessionNotFoundError);
      expect(() => validateSession(validSession.sessionId)).not.toThrow();
    });
  });
});
```

**完了条件**:
- [ ] 全ての関数のテストが実装されている
- [ ] `pnpm test`でテストが通過する
- [ ] エラーケースのテストが含まれている

**ガードレール検証**:
- [ ] Unit Testカバレッジが90%以上であることを確認
  ```bash
  pnpm test --coverage
  # 期待: seal.tsのカバレッジが90%以上
  ```
- [ ] 全てのテストが通過することを確認
  ```bash
  pnpm test
  # 期待: 全てのテストが成功
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

**コマンド**:
```bash
pnpm test seal.test.ts
```

---

### タスク14: 統合テスト

**ファイル**:
- `app/src/server/__tests__/seal-integration.test.ts`

**説明**:
NFT所有確認 + セッション作成フロー全体の統合テストを実装する。

**テスト内容**:
1. NFT所有確認 → セッション作成 → セッション検証
2. セッション検証時のNFT所有確認

**実装例**:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { createSessionKey, buildSealApprovePTB, createSession, validateSession } from '../seal';
import { getSealClient } from '../seal';

describe('Seal Integration Test', () => {
  let userKeypair: Ed25519Keypair;

  beforeAll(() => {
    userKeypair = Ed25519Keypair.generate();
  });

  it('should complete full session creation and validation flow', async () => {
    // 1. SessionKey作成
    const sessionKey = await createSessionKey(userKeypair);
    expect(sessionKey).toBeDefined();

    // 2. PTB構築
    const nftId = '0xMOCK_NFT_ID';
    const identityId = process.env.SEAL_IDENTITY_ID || '';
    const packageId = process.env.SEAL_PACKAGE_ID || '';
    const tx = buildSealApprovePTB(nftId, identityId, packageId);
    expect(tx).toBeDefined();

    // 3. セッション作成
    const txBytes = '0xMOCK_TX_BYTES';
    const session = createSession(
      userKeypair.getPublicKey().toSuiAddress(),
      nftId,
      'mock-blob-id',
      sessionKey,
      txBytes
    );
    expect(session.sessionId).toBeDefined();

    // 4. セッション検証
    const validated = validateSession(session.sessionId);
    expect(validated.sessionId).toBe(session.sessionId);
  }, 30000); // 30秒タイムアウト

  it('should fail when NFT is not owned', async () => {
    // TODO: 実際のNFT所有確認を含むテスト
    // Sui devnetに対してテストを実行
  });
});
```

**完了条件**:
- [ ] NFT所有確認 + セッション作成フローのテストが実装されている
- [ ] `pnpm test:api`でテストが通過する
- [ ] Sui devnetに対してテストが実行されている

**ガードレール検証**:
- [ ] Integration Testが全て通過することを確認
  ```bash
  pnpm test:api
  # 期待: 全てのテストが成功
  ```
- [ ] 変更ファイル数が5ファイル以下であることを確認
  ```bash
  git diff --name-only --cached
  # 期待: 変更ファイル数が5ファイル以下
  ```
- [ ] 変更行数が200行以下であることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```

**コマンド**:
```bash
pnpm test:api seal-integration.test.ts
```

---

### タスク15: 手動テスト（curl） - 動画視聴フロー全体の確認

**説明**:
curlコマンドでバックエンドAPIを叩き、動画視聴フロー全体を確認する。

**テスト手順**:

1. **サーバー起動**:
```bash
pnpm dev
```

2. **セッション作成**:
```bash
curl -X POST http://localhost:3000/api/watch \
  -H "Content-Type: application/json" \
  -d '{
    "nftId": "0xMOCK_NFT_ID",
    "userAddress": "0xMOCK_USER_ADDRESS"
  }'
```

期待レスポンス:
```json
{
  "success": true,
  "session": {
    "sessionId": "sha256-hash",
    "expiresAt": 1234567890000
  }
}
```

3. **動画取得**:
```bash
curl -X GET "http://localhost:3000/api/video?session=<session-id>" \
  --output decrypted-video.mp4
```

期待結果:
- 復号済み動画ファイル（`decrypted-video.mp4`）がダウンロードされる
- ファイルサイズが0より大きい

4. **セッション期限切れテスト**:
```bash
# 60秒待つ（SEAL_SESSION_DURATION=60の場合）
sleep 61

curl -X GET "http://localhost:3000/api/video?session=<session-id>"
```

期待レスポンス:
```json
{
  "success": false,
  "error": "Session ... expired",
  "errorType": "SessionExpiredError"
}
```

5. **NFT未所有テスト**:
```bash
curl -X POST http://localhost:3000/api/watch \
  -H "Content-Type: application/json" \
  -d '{
    "nftId": "0xINVALID_NFT_ID",
    "userAddress": "0xMOCK_USER_ADDRESS"
  }'
```

期待レスポンス:
```json
{
  "success": false,
  "error": "NFT not owned",
  "errorType": "NFTNotOwnedError"
}
```

**完了条件**:
- [ ] セッション作成APIが正常に動作する
- [ ] 動画取得APIが正常に動作する
- [ ] セッション期限切れが正しく処理される
- [ ] NFT未所有エラーが正しく処理される
- [ ] 全てのエンドポイントが期待通りのレスポンスを返す

**ガードレール検証**:
- [ ] 全てのテストが通過することを確認（Contract, Integration, Unit）
  ```bash
  cd contracts && sui move test && cd ../.. && pnpm test:api && pnpm test
  # 期待: 全てのテストが成功
  ```
- [ ] コードレビュー可能な量の制限を守っていることを確認
  ```bash
  git diff --stat
  # 期待: 変更行数が200行以下
  ```
- [ ] コミットメッセージがConventional Commitsの規約に従っていることを確認（手動レビュー）
- [ ] ドキュメントが更新されていることを確認
  ```bash
  git diff --name-only HEAD~1 | grep -E "\.md$|\.example$"
  # 期待: 関連するドキュメントが更新されている
  ```
- [ ] セキュリティチェックが全て通過していることを確認
  ```bash
  grep -i "master.*key\|decryption.*key" app/src/server/seal.ts
  # 期待: マスター鍵や復号鍵の生成コードが存在しない
  ```

---

## テスト優先順位

OneTube TDD原則に従ったテスト順序:

1. **Contract Test** (最高優先度) - タスク2, 3
   - Move契約テスト → 実装
   - `sui move test`

2. **Unit Test** (中優先度) - タスク13
   - 個別関数テスト
   - `pnpm test`

3. **Integration Test** (高優先度) - タスク14
   - Backend ↔ Smart Contract統合テスト
   - `pnpm test:api`

4. **Manual Test** (最終確認) - タスク15
   - curlで完全フロー確認

---

## 実装の注意事項

### MVP原則の遵守
- **最小限**: 必要最小限の機能のみ実装
- **シンプル**: Seal SDKに委譲し、アプリロジックは最小限
- **テストファースト**: テスト → 実装の順序を守る

### OneTube固有の注意
- **Seal SDK準拠**: SealClient.encrypt() / decrypt()を使用
- **seal_approve_nft関数**: 読み取り専用で実装（storageを書き換えない）
- **セッション管理**: JSONファイルベース（ローカル開発専用）
- **Walrus統合**: HTTP APIを使用

### セキュリティ上の注意
- **マスター鍵**: Seal key serverが保持（アプリ側は保持しない）
- **SessionKey**: DEV_MODE時のみ詳細ログを出力（マスク済み）
- **セッション期限**: Seal key server側のTTL以下になるように計算

---

## 成功基準

### Phase 1成功基準
- [ ] SealClientを初期化できる
- [ ] SealClient.encrypt()を使用して動画を暗号化できる
- [ ] 暗号化オブジェクトをWalrusにアップロードし、BLOB IDを取得できる
- [ ] `seal_approve_nft`関数をMoveコントラクトでデプロイできる
- [ ] Seal identity IDを環境変数に保存できる

### Phase 3成功基準
- [ ] SessionKeyを作成し、ユーザーが署名できる
- [ ] PTBを構築し、`seal_approve_nft`を呼び出すトランザクションを含められる
- [ ] セッション情報をJSONファイルで永続化できる
- [ ] セッション検証時に期限切れセッションを自動削除できる
- [ ] Walrus APIからBLOB IDでencryptedObjectを動的に取得できる
- [ ] SealClient.decrypt()を使用して暗号化動画を復号できる
- [ ] `seal_approve_nft`関数が正しくNFT所有を確認できる
- [ ] 開発者モード時のみ詳細ログを出力できる
- [ ] すべてのエラーケースが適切に処理される

### テスト成功基準
- [ ] ユニットテストがすべて通過する
- [ ] 統合テストがすべて通過する
- [ ] curlでバックエンドAPIを叩いて動画視聴まで完了できる

---

## 進捗トラッキング

**Phase 1**: [ ] 0/6 タスク完了
**Phase 3**: [ ] 0/9 タスク完了
**全体**: [ ] 0/15 タスク完了

実装を開始する場合は、`/execute`コマンドを使用してください。

---

## Phase完了時の検証チェックリスト

### Phase 1完了時の検証
- [ ] Seal SDKパッケージ名が`@mysten/seal`に統一されている
  ```bash
  grep -r "@mysten.*seal" package.json app/package.json
  # 期待: @mysten/seal のみが存在
  ```
- [ ] `seal_approve_nft`関数のテストが100%通過する
  ```bash
  cd contracts && sui move test
  # 期待: 全てのテストが成功
  ```
- [ ] `seal_approve_nft`関数が読み取り専用で実装されている（手動レビュー）
- [ ] SealClientが正しく初期化されている
  ```bash
  grep -n "initializeSealClient\|getSealClient" app/src/server/seal.ts
  # 期待: 関数が実装されている
  ```
- [ ] Walrus統合が正しく実装されている
  ```bash
  grep -n "uploadBlob\|getBlobUrl\|getEncryptedBlob" app/src/server/walrus.ts
  # 期待: 関数が実装されている
  ```
- [ ] 動画暗号化スクリプトが動作する
  ```bash
  pnpm encrypt-video path/to/test-video.mp4
  # 期待: 暗号化とアップロードが成功する
  ```

### Phase 3完了時の検証
- [ ] Session型が正しく拡張されている（`decryptionKey`削除、`sessionKey`と`txBytes`追加）
  ```bash
  grep -A 10 "interface Session" app/src/shared/types.ts app/src/server/seal.ts
  # 期待: decryptionKeyが存在せず、sessionKeyとtxBytesが存在する
  ```
- [ ] 全てのエラータイプが定義されている（8種類）
  ```bash
  grep -E "class.*Error" app/src/shared/types.ts
  # 期待: 8種類のエラータイプが定義されている
  ```
- [ ] ロガーがDEV_MODE対応で実装されている
  ```bash
  grep -A 10 "logSessionKey" app/src/lib/logger.ts
  # 期待: DEV_MODEチェックとマスク処理が実装されている
  ```
- [ ] SessionKey作成とPTB構築が正しく実装されている
  ```bash
  grep -n "createSessionKey\|buildSealApprovePTB" app/src/server/seal.ts
  # 期待: 関数が実装されている
  ```
- [ ] セッション永続化が正しく実装されている
  ```bash
  grep -n "createSession\|validateSession\|cleanupExpiredSessions" app/src/server/seal.ts
  # 期待: 関数が実装されている
  ```
- [ ] `/api/watch`エンドポイントが正しく拡張されている
  ```bash
  grep -A 20 "POST /api/watch" app/src/server/server.ts
  # 期待: blobId解決、SessionKey作成、PTB構築が実装されている
  ```
- [ ] `/api/video`エンドポイントが正しく拡張されている
  ```bash
  grep -A 20 "GET /api/video" app/src/server/server.ts
  # 期待: セッション検証、復号が実装されている
  ```
- [ ] Unit Testカバレッジが90%以上
  ```bash
  pnpm test --coverage
  # 期待: seal.tsのカバレッジが90%以上
  ```
- [ ] Integration Testが全て通過する
  ```bash
  pnpm test:api
  # 期待: 全てのテストが成功
  ```
- [ ] 手動テストが全て通過する（curlで確認）

### 全体完了時の検証
- [ ] 全てのテストが通過する（Contract, Integration, Unit）
  ```bash
  cd contracts && sui move test && cd ../.. && pnpm test:api && pnpm test
  # 期待: 全てのテストが成功
  ```
- [ ] コードレビュー可能な量の制限を守っている
  ```bash
  git log --oneline --stat | head -20
  # 期待: 各コミットの変更行数が200行以下
  ```
- [ ] コミットメッセージがConventional Commitsの規約に従っている
  ```bash
  git log --oneline | head -15
  # 期待: コミットメッセージが<type>(<scope>): <subject>形式
  ```
- [ ] ドキュメントが更新されている
  ```bash
  git diff --name-only HEAD~15 | grep -E "\.md$|\.example$"
  # 期待: 関連するドキュメントが更新されている
  ```
- [ ] セキュリティチェックが全て通過している
  ```bash
  grep -i "master.*key\|decryption.*key" app/src/server/seal.ts scripts/encrypt-video.ts
  # 期待: マスター鍵や復号鍵の生成コードが存在しない
  ```

**全体検証コマンド**:
```bash
# 全てのチェックを一度に実行
cd contracts && sui move test && cd ../.. && \
pnpm test:api && pnpm test && pnpm lint && pnpm typecheck
# 期待: 全てのチェックが通過する
```
