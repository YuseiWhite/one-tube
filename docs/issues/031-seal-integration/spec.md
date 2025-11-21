# 機能仕様書: Seal統合実装（Phase 1 + Phase 3）

**機能ブランチ**: `feature/yuseiwhite`
**作成日**: 2025-11-21
**ステータス**: ドラフト
**OneTubeプロジェクト**: NFT-Gated Video Streaming Platform

---

## ⚡ OneTube MVP ガイドライン

### MVP設計方針
1. **動作する** → テストが通る
2. **わかりやすい** → コードが読みやすい
3. **速く書ける** → ボイラープレート最小xw

### 技術スタック
- **Blockchain**: Sui devnet、Move言語
- **NFT標準**: Kiosk標準（必須）
- **Storage**: Walrus分散ストレージ
- **Encryption**: Seal SDK（暗号化・復号・アクセス制御をSealに委譲）
- **Backend**: Express + TypeScript
- **Session Storage**: JSONファイルベース永続化

### テスト優先順位
1. **Contract Test**: Move契約の単体テスト（seal_approve_nft関数）
2. **Integration Test**: Backend ↔ Smart Contract統合（NFT所有確認 + セッション作成）
3. **Unit Test**: `seal.ts`の各関数

---

## ユーザーシナリオとテスト *(必須)*

### 主要なユーザーストーリー

#### Phase 1: 運営の事前準備
- 運営がSealClientを使用して完全版動画を暗号化し、Walrusにアップロードする
- Moveモジュールで`seal_approve_nft`関数を定義し、「プレミアムチケットNFT所有」をアクセス条件として設定する
- 暗号化されたBLOB IDとSeal identity IDをNFTメタデータに記録する
- マスター鍵はSeal key serverが保持（アプリ側は保持しない）

#### Phase 3: ファンの視聴フロー
- ファンがNFTを所有している状態で、動画視聴をリクエストする
- フロントエンド/バックエンドでSessionKeyを作成し、ユーザーが署名する
- PTB（Programmable Transaction Block）で`seal_approve_nft`を呼び出すトランザクションを構築
- SealClient.decrypt()で暗号化された動画を復号し、ストリーミング配信する
- セッション期限が切れたら、新しいSessionKeyが必要になる

### 受け入れシナリオ

#### Phase 1: 動画暗号化とアップロード

**シナリオ1: 動画暗号化とWalrusアップロード**
- **前提**: 完全版動画ファイルが存在する
- **操作**: 運営がSealClient.encrypt()を使用して動画を暗号化
- **結果**: Seal暗号化オブジェクト（encryptedObject）が生成され、WalrusにアップロードされてBLOB IDが取得される
- **鍵管理**: マスター鍵はSeal key serverが保持（アプリ側は保持しない）

**シナリオ2: seal_approve関数の定義**
- **前提**: Moveコントラクトがデプロイされている
- **操作**: `seal_approve_nft`関数をMoveモジュールで定義
- **結果**: NFT所有確認ロジックがon-chainで定義され、Seal identity IDと紐付けられる

#### Phase 3: セッション作成と視聴

**シナリオ3: セッション作成（NFT所有確認成功）**
- **前提**: ユーザーがPremiumTicketNFTを所有している
- **操作**: フロントエンド/バックエンドでSessionKeyを作成し、ユーザーが署名する
- **結果**: SessionKeyが作成され、NFT所有確認用のPTBが構築される

**シナリオ4: 動画視聴（復号成功）**
- **前提**: 有効なSessionKeyが存在し、PTBで`seal_approve_nft`が呼び出される
- **操作**: `/api/video?session=<session-id>`にリクエスト（blobIdはセッション情報から内部で取得）
- **結果**: SealClient.decrypt()で暗号化された動画を復号し、復号済み動画URLが返される
- **セキュリティ**: URLが漏洩しても、セッション期限が切れると再アクセス不可。YouTubeメンバーシップ動画と同様に、URL自体は一時的なアクセストークンとして機能する

**シナリオ5: セッション期限切れ**
- **前提**: SessionKeyが期限切れ
- **操作**: `/api/video?session=<session-id>`にリクエスト
- **結果**: `SessionExpiredError`が返され、新しいSessionKey作成が必要

### エッジケース

#### NFT所有確認エラー
- NFTを所有していないユーザーが視聴しようとした場合 → `NFTNotOwnedError`を返す
- NFTを所有していたが、視聴前にNFTを手放した場合 → セッション検証時に`NFTNotOwnedError`を返す
- Sui RPC接続エラー時 → `RPCConnectionError`を返す（新規エラータイプ）

#### セッション管理エラー
- セッションが期限切れの場合 → `SessionExpiredError`を返す
- 存在しないセッションIDでリクエストした場合 → `SessionNotFoundError`を返す（新規エラータイプ）
- セッションファイルの読み込みエラー時 → `SessionStorageError`を返す（新規エラータイプ）

#### Walrus統合エラー
- Walrus API接続エラー時 → `WalrusConnectionError`を返す（新規エラータイプ）
- BLOB IDが存在しない場合 → `BlobNotFoundError`を返す（新規エラータイプ）
- 復号失敗時 → `DecryptionError`を返す（新規エラータイプ）

#### 暗号化・復号エラー
- 復号キーが無効な場合 → `DecryptionError`を返す

#### URL漏洩時のセキュリティ

#### 現在の実装のセキュリティレベル
- **セッション期限**: 1分で自動的に無効化（SealのSessionKey ttlMinは最小1分のため）
- **NFT所有確認**: セッション検証時に毎回実行
- **URL漏洩リスク**: URLが漏洩しても、セッション期限が切れると再アクセス不可

#### YouTubeメンバーシップ動画との比較
- **YouTubeの仕組み**: 
  - メンバーシップ動画のURLは一時的な署名付きURL（通常数時間の有効期限）
  - URLが漏洩しても、有効期限が切れると再アクセス不可
  - メンバーシップ状態の確認はYouTubeサーバー側で実行
- **OneTubeの実装**:
  - セッションURLは1分の有効期限（開発環境、SealのSessionKey ttlMinは最小1分のため。本番では公式より30分未満推奨）
  - URLが漏洩しても、セッション期限が切れると再アクセス不可
  - NFT所有確認はon-chainで実行（より透明性が高い）
- **結論**: 現在の実装はYouTubeメンバーシップ動画と同等以上のセキュリティレベルを提供している

---

## 要件 *(必須)*

### 機能要件

#### Phase 1: 動画暗号化とseal_approve_nft関数設定

**FR-001**: システムは完全版動画ファイルをSeal SDKで暗号化できなければならない
- SealClient.encrypt()を使用して暗号化
- マスター鍵はSeal key serverが保持（アプリ側は保持しない）
- 暗号化パラメータ:
  - `threshold`: 復号に必要なkey serverの数
  - `packageId`: `seal_approve_nft`関数を含むMoveパッケージID
  - `id`: Seal identity ID（アクセス制御ポリシーと紐付け）
  - `data`: 暗号化する動画データ
- 戻り値: `encryptedObject`（Walrusに保存）と`key`（DEM用対称鍵）
- **keyの扱い**: MVPでは基本は即破棄する。将来「DRのために保存する」ケースが出たら、そのときにKMS/HSM等の専用の安全なストアで管理する設計を検討する

**FR-002**: システムは暗号化された動画をWalrusにアップロードできなければならない
- Walrus Publisher APIを使用してBLOBをアップロード
- アップロード成功時にBLOB IDを取得
- BLOB IDは後続処理で使用可能な形式で保存

**FR-003**: システムはon-chainで`seal_approve_nft`関数を定義できなければならない
- Moveモジュールで`seal_approve_nft`関数を定義
- 関数シグネチャ: `seal_approve_nft(id: vector<u8>, ticket: &PremiumTicketNFT, ctx: &TxContext)`
- **セキュリティ**: `user`引数は使用せず、`tx_context::sender(ctx)`でトランザクションのsenderを取得する（PTBのsenderと一貫性を保つため）
- アクセス条件: `PremiumTicketNFT`所有を確認（所有していない場合はabort）
- **ポリシーの制約**: `seal_approve_nft`関数は読み取り専用で実装する（storageを書き換えない）。Seal key serverが`dry_run_transaction_block`で評価するため、stateを変更する処理は禁止
- Seal identity IDと紐付けられる

**FR-004**: システムはBLOB IDからWalrus API経由で動画URLを動的に取得できなければならない
- Walrus Aggregator APIを使用してBLOB IDからURLを解決
- `videos.json`への依存を削除
- エラー時は適切なエラーハンドリングを実装

#### Phase 3: セッション管理と視聴

**FR-005**: システムはSessionKeyを作成し、PTBで`seal_approve_nft`を呼び出せるようにしなければならない
- フロントエンド/バックエンドでSessionKeyを作成
- ユーザーがSessionKeyに署名する
- PTB（Programmable Transaction Block）を構築し、`seal_approve_nft`を呼び出すトランザクションを含める
- Seal key serverが`dry_run_transaction_block`で`seal_approve_nft`を評価し、NFT所有を確認

**FR-006**: システムはSessionKeyを管理できなければならない
- SessionKeyはSeal SDKで作成される
- SessionKeyはユーザーが署名する必要がある
- **SessionKeyの有効期限管理**:
  - **ソース・オブ・トゥルース**: Seal key server側のTTL/maxEpochが最終的な有効期限の決定権を持つ
  - **バックエンドのexpiresAt**: Seal key server側のTTL以下になるように計算し、バックエンド側で管理する
  - **動作**: バックエンドは`expiresAt`を過ぎたら`SealClient.decrypt()`を呼ばない（事前にセッション期限切れとして拒否）
  - これにより、Seal key server側のTTLを超えたリクエストを事前にブロックし、不要なAPI呼び出しを防止
- SessionKeyはセッション情報としてJSONファイルに保存（一時的、ローカル開発専用）

**FR-007**: システムはセッション情報をJSONファイルで永続化できなければならない
- セッション作成時にJSONファイルに保存
- セッション検証時にJSONファイルから読み込み
- 期限切れセッションは自動削除（検証時またはクリーンアップ時）

**FR-008**: システムはSeal SDKを使用して暗号化された動画を復号できなければならない
- Walrusから暗号化BLOB（encryptedObject）を取得
- SealClient.decrypt()を使用して復号を実行
- **復号パラメータ**:
  - `data`: encryptedObject（Walrusから取得）
  - `sessionKey`: ユーザーが署名したSessionKey（セッション情報から取得）
  - `txBytes`: `seal_approve_nft`を呼び出すPTBのバイト列（セッション情報から取得）
- **復号タイミング**: `/api/video`エンドポイント内で、セッション情報に紐づくblobIdに対応する動画のみを復号する
- **復号方式**: 
  - セッション情報からblobIdを取得（ユーザーからは受け取らない）
  - blobIdに対応するencryptedObjectをWalrusから取得
  - SealClient.decrypt()がSeal key serverから鍵を取得し、復号を実行
  - その動画ファイル全体をメモリに展開してから復号（動画ファイル単位での復号）
  - MVPでは短い動画前提で、ストリーム復号は将来機能
- **blobIdの解決**: blobIdはセッション情報から内部で取得し、NFT所有確認は`seal_approve_nft`関数でon-chainで実行される
- 復号済み動画を一時URLとして返却（キャッシュやファイル保存は行わない）

**FR-009**: システムは開発者モードでのみセッションキーをログ出力できなければならない
- 環境変数`DEV_MODE=true`の場合のみログ出力
- デフォルトではセッションキーをログに出力しない
- その他のデバッグ情報は通常通りログ出力

### OneTube固有の技術要件

**TR-001**: `seal_approve_nft`関数はMoveモジュールで実装する
- `contracts/sources/contracts.move`に`seal_approve_nft`関数を追加
- 関数シグネチャ: `seal_approve_nft(id: vector<u8>, ticket: &PremiumTicketNFT, ctx: &TxContext)`
- **セキュリティ**: `user`引数は使用せず、`tx_context::sender(ctx)`でトランザクションのsenderを取得する（PTBのsenderと一貫性を保つため）
- NFT所有確認ロジックを実装（所有していない場合はabort）
- **ポリシーの制約**: `seal_approve_nft`関数は読み取り専用で実装する（storageを書き換えない）。Seal key serverが`dry_run_transaction_block`で評価するため、stateを変更する処理は禁止
- **非決定的APIの禁止**: Randomモジュール等の非決定的APIは使用しない。Seal key serverが`dry_run_transaction_block`で評価するため、非決定的な処理は禁止
- Seal identity IDと紐付けられる

**TR-002**: NFT所有確認は`PremiumTicketNFT`タイプのみを対象とする
- Sui RPCの`getOwnedObjects()`で`StructType`フィルタを使用
- `PACKAGE_ID::contracts::PremiumTicketNFT`形式で検索
- 運営者の動画を見るためにはPremiumTicketNFTオブジェクトを持っている必要がある
- 将来的にはクリエイターの動画に対してクリエイターが指定したNFTを持っている必要がある形になるが、NFTタイプ指定機能は不要（PremiumTicketNFTのみで十分）

**TR-003**: Walrus統合はPublisher APIとAggregator APIを使用する
- Publisher API: BLOBアップロード（Phase 1）
- Aggregator API: BLOB IDからURL解決（Phase 3）
- 環境変数`WALRUS_API_URL`と`WALRUS_AGGREGATOR_URL`を使用

**TR-004**: セッション管理はファイルベース（JSON）で実装する
- `app/data/sessions.json`に保存
- サーバー起動時に既存セッションを読み込み
- 定期的なクリーンアップで期限切れセッションを削除

### 主要エンティティ

**Seal Identity**: Sealアクセス制御の識別子
- `id`: Seal identity ID（vector<u8>形式、package IDのprefixなし）
- `packageId`: `seal_approve_nft`関数を含むMoveパッケージID
- `access_condition`: `seal_approve_nft`関数で定義されるNFT所有確認条件

**Session**: セッション情報
- `sessionId`: セッションID（SHA-256ハッシュ）
- `userAddress`: ユーザーウォレットアドレス
- `nftId`: NFTオブジェクトID
- `blobId`: Walrus BLOB ID（内部解決用、ユーザーからは受け取らない）
- `sessionKey`: Seal SessionKeyオブジェクト（ユーザー署名済み）
- `txBytes`: `seal_approve_nft`を呼び出すPTBのバイト列
- `createdAt`: 作成タイムスタンプ（Unix timestamp ms）
- `expiresAt`: 有効期限（Unix timestamp ms、バックエンド側で管理、Seal key server側のTTL以下になるように計算）
- **注意**: `decryptionKey`フィールドは存在しない（復号鍵はSeal key serverが管理）

**EncryptedObject**: Seal暗号化オブジェクト
- `blobId`: Walrus BLOB ID
- `encryptedObject`: Seal SDKで生成された暗号化オブジェクト（BCSシリアライズ済み）
- `id`: Seal identity ID（アクセス制御ポリシーと紐付け）
- `packageId`: `seal_approve_nft`関数を含むMoveパッケージID
- `threshold`: 復号に必要なkey serverの数

---

## 実装詳細

### 1. Phase 1実装範囲

#### 1.1 SealClientの初期化
- **ファイル**: `app/src/server/seal.ts`または`app/src/lib/seal.ts`
- **機能**:
  - SealClientを初期化
  - Key serverのobject IDを設定（環境変数から取得）
  - `verifyKeyServers`: ローカル開発ではfalse（パフォーマンス優先）、**本番環境ではtrue**（Key serverのなりすまし防止）

#### 1.2 動画暗号化スクリプト
- **ファイル**: `scripts/encrypt-video.ts`
- **機能**:
  - 動画ファイルを読み込み
  - SealClient.encrypt()を使用して暗号化
  - パラメータ:
    - `threshold`: 復号に必要なkey serverの数
    - `packageId`: MoveパッケージID
    - `id`: Seal identity ID
    - `data`: 動画データ
  - `encryptedObject`をWalrusにアップロード
  - `key`（DEM用対称鍵）は基本は即破棄。将来「DRのために保存する」ケースが出たら、そのときにKMS/HSM等の専用の安全なストアで管理する設計を検討する

#### 1.3 seal_approve_nft Move関数
- **ファイル**: `contracts/sources/contracts.move`（既存ファイルに追加）
- **機能**:
  - `seal_approve_nft`関数を定義
  - 関数シグネチャ: `seal_approve_nft(id: vector<u8>, ticket: &PremiumTicketNFT, ctx: &TxContext)`
  - **セキュリティ**: `user`引数は使用せず、`tx_context::sender(ctx)`でトランザクションのsenderを取得する（PTBのsenderと一貫性を保つため）
  - NFT所有確認ロジックを実装（所有していない場合はabort）
  - **ポリシーの制約**: `seal_approve_nft`関数は読み取り専用で実装する（storageを書き換えない）。Seal key serverが`dry_run_transaction_block`で評価するため、stateを変更する処理は禁止
  - `PremiumTicketNFT`タイプのみを対象
- **Seal identityとNFT/動画の関係**:
  - **1 NFT = 全ての動画**: 1つのPremiumTicketNFTを所有していれば、運営が決めたアドレス（任意の数）によってWalrusにアップロードされた全ての暗号化動画にアクセス可能
  - **seal_approve_nftの意味**: 「PremiumTicketNFTを持っているならblobId問わずOK」という扱い
  - **Seal identity ID**: 環境変数`SEAL_IDENTITY_ID`に1つだけ設定（複数のidentityは不要）

#### 1.4 seal_approve_nft Moveコントラクトテスト
- **ファイル**: `contracts/tests/contracts_tests.move`（既存ファイルに追加）
- **テストケース**:
  - NFTを所有している場合のみアクセス可能であることを確認
  - NFTを所有していない場合はアクセス不可であることを確認

### 2. 暗号化・復号実装

#### 2.1 暗号化・復号実装（Seal SDKを使用）
- **実装レベル**: Seal SDK（@mysten/seal）を使用
- **暗号化**: SealClient.encrypt()を使用
  - マスター鍵はSeal key serverが保持（アプリ側は保持しない）
  - 暗号アルゴリズムはSeal SDKが選択（AES-256-GCMまたはHMAC-CTR）
  - データ改ざん検知は自動的に行われる
- **復号**: SealClient.decrypt()を使用
  - SessionKeyとPTB（`seal_approve_nft`を呼び出す）が必要
  - Seal key serverから鍵を取得し、復号を実行
  - 認証タグ検証は自動的に行われる
- **鍵管理**: アプリ側で鍵を生成・保持しない（Seal key serverに委譲）
- **セキュリティ**: 
  - マスター鍵の漏洩リスクを排除（アプリ側に鍵がない）
  - Seal公式の推奨方法に準拠
  - OWASPガイドラインに準拠

#### 2.2 セッション管理永続化
- **保存形式**: JSONファイル（`app/data/sessions.json`）
- **ローカル開発専用**: `sessions.json`はローカル開発専用（`.gitignore`に追加済み、リポジトリには含めない）
- **読み込み**: サーバー起動時に既存セッションを読み込み
- **書き込み**: セッション作成・更新時にファイルに保存
- **クリーンアップ**: 期限切れセッションを自動削除（検証時または定期実行）
- **同時アクセス前提**: MVPは「サーバープロセス1つ」「同時アクセス少ない」前提
- **書き込み方針**: 1リクエストあたり `read → mutate in memory → write` で素朴に上書き
- **エラーハンドリング**: 書き込み中に例外が起きたら`SessionStorageError`に包んで返すだけでリトライしない
- **複数プロセス対応**: 複数プロセス/多ノード対応はPhase 1/3のスコープ外
- **MVP制約**: SessionKeyは一旦server-side JSONに保存するが、**本番運用ではSessionKeyのserver-side永続化はやめ、clientもしくは短期in-memoryにする**
- **セキュリティ**: セッションJSONに`ephemeralSecretKey`を書き出すのはローカル開発のみ。本番環境ではSessionKeyをサーバー側に永続化しない（Seal公式推奨の「ゼロ知識に近い構成」に寄せる）
- **SessionKeyの有効期限管理**:
  - **ソース・オブ・トゥルース**: Seal key server側のTTL/maxEpochが最終的な有効期限の決定権を持つ
  - **バックエンドのexpiresAt**: Seal key server側のTTL以下になるように計算し、バックエンド側で管理する
  - **動作**: バックエンドは`expiresAt`を過ぎたら`SealClient.decrypt()`を呼ばない（事前にセッション期限切れとして拒否）
  - これにより、Seal key server側のTTLを超えたリクエストを事前にブロックし、不要なAPI呼び出しを防止

### 3. Walrus統合の詳細

#### 3.1 Walrus API選択
Walrus公式では以下の3つの選択肢がある：
1. **Walrus CLI**: コマンドラインインターフェース
2. **JSON API of the Walrus CLI**: CLIのJSON API
3. **HTTP API exposed by a public or local Walrus client daemon**: 公開またはローカルのWalrusクライアントデーモンが公開するHTTP API

**推奨**: HTTP API（選択肢3）を推奨
- **理由**: バックエンドをクラウドに載せることを考慮すると、HTTP APIが最も適している
  - クラウド環境から直接HTTPリクエストでアクセス可能
  - デーモンの管理が不要（公開Walrusサービスを使用）
  - スケーラビリティが高い
  - 認証・認可の実装が容易

#### 3.2 暗号化BLOBの保存
- **方法**: Walrus HTTP APIに暗号化動画をアップロード
- **BLOB ID取得**: アップロード成功時にBLOB IDを取得
- **メタデータ保存**: BLOB IDをNFTメタデータに記録

#### 3.3 BLOB IDから動画URL解決
- **方法**: Walrus HTTP APIから動的に取得
- **実装**: `app/src/server/walrus.ts`に`getBlobUrl(blobId: string)`関数を追加
- **エラーハンドリング**: BLOB IDが存在しない場合は`BlobNotFoundError`を返す

### 4. NFT所有確認の実装詳細

#### 4.1 NFT所有確認（seal_approve_nft関数）
- **確認タイミング**: SealClient.decrypt()呼び出し時
- **確認方法**: Seal key serverが`dry_run_transaction_block`で`seal_approve_nft`を評価
- **Move関数**: `seal_approve_nft(id: vector<u8>, ticket: &PremiumTicketNFT, ctx: &TxContext)`
- **セキュリティ**: `user`引数は使用せず、`tx_context::sender(ctx)`でトランザクションのsenderを取得する（PTBのsenderと一貫性を保つため）
- **動作**: NFTを所有していない場合はabortし、復号鍵は発行されない
- **ポリシーの制約**: `seal_approve_nft`関数は読み取り専用で実装する（storageを書き換えない）。Seal key serverが`dry_run_transaction_block`で評価するため、stateを変更する処理は禁止
- **理由**: NFTを手放した場合に即座にアクセスを拒否するため

#### 4.2 NFTタイプと動画アクセス
- **固定タイプ**: `PremiumTicketNFT`のみを対象
- **実装**: `PACKAGE_ID::contracts::PremiumTicketNFT`で検索
- **動画アクセス**: 1つのPremiumTicketNFTを所有していれば、運営が決めたアドレスによってWalrusにアップロードされた全ての暗号化動画にアクセス可能
- **Seal identity ID**: SEAL_IDENTITY_IDはOneTube全動画共通（1つのidentity IDで全ての動画にアクセス可能）
- **将来の拡張**: クリエイター毎に権限分割する場合は、`channel_id`単位でSeal identity IDを分割する設計が可能（例：`SEAL_IDENTITY_ID_<channel_id>`）
- **API設計**: `/api/watch`リクエストは`{ nftId, userAddress }`のみで、blobIdは内部で解決する（外からblobIdを渡させない）
- **blobIdの解決**: バックエンド側でNFTメタデータからblobIdを取得し、内部で管理する

### 5. エラーハンドリングとセキュリティ

#### 5.1 エラーケースの定義
- **既存エラー**: `NFTNotOwnedError`、`SessionExpiredError`
- **新規エラー**:
  - `RPCConnectionError`: Sui RPC接続エラー
  - `SessionNotFoundError`: セッションが見つからない
  - `SessionStorageError`: セッションファイル読み込みエラー
  - `WalrusConnectionError`: Walrus API接続エラー
  - `BlobNotFoundError`: BLOB IDが存在しない
  - `SealDecryptionError`: Seal復号失敗（`seal_approve_nft`でabortされた場合など）
  - `SealEncryptionError`: Seal暗号化失敗
  - `SealKeyServerError`: Seal key server接続エラー

#### 5.2 エラー → HTTPステータスコード対応表

| エラー型 | HTTPステータスコード | 説明 |
|---------|---------------------|------|
| `NFTNotOwnedError` | 403 Forbidden | NFTを所有していないためアクセス拒否 |
| `SessionExpiredError` | 401 Unauthorized | セッションが期限切れ |
| `SessionNotFoundError` | 401 Unauthorized | セッションが見つからない |
| `RPCConnectionError` | 502 Bad Gateway | Sui RPC接続エラー（外部サービスエラー） |
| `WalrusConnectionError` | 502 Bad Gateway | Walrus API接続エラー（外部サービスエラー） |
| `SessionStorageError` | 500 Internal Server Error | セッションファイルの読み込み/書き込みエラー |
| `BlobNotFoundError` | 404 Not Found | BLOB IDが存在しない |
| `SealDecryptionError` | 500 Internal Server Error | Seal復号処理の失敗（`seal_approve_nft`でabortされた場合など） |
| `SealEncryptionError` | 500 Internal Server Error | Seal暗号化処理の失敗 |
| `SealKeyServerError` | 502 Bad Gateway | Seal key server接続エラー |
| `InvalidInputError` | 400 Bad Request | リクエストパラメータが無効 |

**エラーレスポンス形式**:
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "errorType": "エラー型名"
}
```

#### 5.3 ログポリシーとPII（個人識別情報）

**基本方針**:
- 基本必要なログは出力する
- 開発者モード時は積極的にログを出力する
- クラウドでバックエンドを載せる際は、開発者モードを無効にすることでセキュアにする

**ログレベル別の出力内容**:

| 情報 | INFOログ | DEBUGログ | DEV_MODE時 |
|------|---------|-----------|------------|
| `userAddress` | ✅ 出力 | ✅ 出力 | ✅ 出力 |
| `sessionId` | ✅ 出力 | ✅ 出力 | ✅ 出力 |
| `nftId` | ✅ 出力 | ✅ 出力 | ✅ 出力 |
| `blobId` | ✅ 出力 | ✅ 出力 | ✅ 出力 |
| `sessionKey` | ❌ 出力しない | ❌ 出力しない | ✅ 出力（マスク済み） |
| `encryptedObject` | ❌ 出力しない | ❌ 出力しない | ✅ 出力（サイズのみ） |
| 外部APIレスポンス本文 | ❌ 出力しない | ✅ 出力 | ✅ 出力 |
| 外部API URL | ✅ 出力 | ✅ 出力 | ✅ 出力 |

**実装方針**:
- `app/src/lib/logger.ts`に条件付きログ関数を追加
- `DEV_MODE=true`の場合のみ、`sessionKey`や`encryptedObject`の詳細をログ出力（マスク済み）
- **本番環境では絶対に生SessionKeyをログに出さない**: 本番環境では`DEV_MODE=false`に設定し、SessionKeyの詳細は一切ログに出力しない
- 外部API（Sui RPC、Walrus、Seal key server）のレスポンス本文はDEBUGログのみ（本番環境ではDEBUGログはOFF）
- エラー発生時は、エラーメッセージとエラー型をINFOログに出力

#### 5.4 秘密情報の配置と運用

**Seal key serverの設定**:
- **Key server object ID**: 環境変数`SEAL_KEY_SERVER_OBJECT_IDS`で管理（カンマ区切り）
- **開発環境**: `.env`ファイルで管理（リポジトリには含めない）
- **本番環境**: クラウドのSecret Manager（AWS Secrets Manager、Google Secret Manager等）で管理
- **ローカル開発**: `.env.local`をリポジトリ外に置く（`.gitignore`に追加済み）
- **セキュリティ**: マスター鍵はSeal key serverが保持（アプリ側は保持しない）

### 6. テスト戦略

#### 6.1 テスト範囲
- **Contract Test**: `contracts/tests/contracts_tests.move`に`seal_approve_nft`関数のテストを追加
  - NFTを所有している場合のみアクセス可能
  - NFTを所有していない場合はアクセス不可
- **ユニットテスト**: `app/src/server/seal.ts`の各関数
  - `verifyNFTOwnership()`
  - `createSession()`
  - `validateSession()`
  - `sealEncrypt()`（新規、SealClient.encrypt()の薄いラッパー）
  - `sealDecrypt()`（新規、SealClient.decrypt()の薄いラッパー）
- **統合テスト**: NFT所有確認 + セッション作成フロー
  - NFT所有確認 → セッション作成 → セッション検証
  - セッション検証時のNFT所有確認
- **手動テスト**: curlでバックエンドAPIを叩いて動画視聴まで完了

#### 6.2 モックデータの準備
- **既存seedスクリプトを使用**: `scripts/commands/seed.ts`
- **NFTフィールド変更**: 実際のチケット購入に寄せたフィールド設定
- **テスト用動画**: 既存のモック動画を使用


### 7. API設計（最小限実装）

#### 7.1 エンドポイント
- **POST /api/watch**: セッション作成（既存、拡張）
  - リクエスト: `{ nftId, userAddress }`（blobIdは不要、内部で解決）
  - レスポンス: `{ success, session: SessionMetadata }`
  - 内部処理: 
    - NFTメタデータからblobIdを内部で解決
    - SessionKey作成 → ユーザー署名 → PTB構築（`seal_approve_nft`を含む） → セッション作成 → JSONファイル保存
- **GET /api/video?session=<session-id>`**: 動画取得（既存、拡張）
  - リクエスト: `session`のみ（blobIdはセッション情報から内部で取得）
  - 内部処理: 
    - セッション検証 → セッション情報からblobIdを取得 → encryptedObjectをWalrusから取得 → SealClient.decrypt()で復号 → 一時URL返却
  - **復号タイミング**: セッションに紐づくblobIdに対応する動画のみを復号（全ての動画を復号するわけではない）
  - **復号方式**: SealClient.decrypt()がSeal key serverから鍵を取得し、復号を実行。指定されたblobIdのBLOB全体をメモリに展開してから復号（動画ファイル単位での復号、ストリーム復号は将来機能）
  - **セキュリティ**: blobIdはセッション情報から内部で取得し、ユーザーからは受け取らない。NFT所有確認は`seal_approve_nft`関数でon-chainで実行され、PremiumTicketNFTを所有している場合のみ復号鍵が発行される
- **削除API**: 実装しない（セッションは自動削除されるため）
- **セッション一覧API**: 実装しない（MVPでは不要）

---

## 技術的な詳細仕様

### seal_approve_nft Move関数構造

```move
// contracts/sources/contracts.move

use sui::tx_context::{Self, TxContext};

/// Sealアクセス制御関数: PremiumTicketNFT所有を確認
/// id: Seal identity ID（package IDのprefixなし）
/// ticket: 所有確認するPremiumTicketNFTオブジェクト
/// ctx: トランザクションコンテキスト（senderを取得するため）
/// 
/// セキュリティ: user引数は使用せず、tx_context::sender()でトランザクションのsenderを取得する
/// ポリシーの制約: この関数は読み取り専用で実装する（storageを書き換えない）
entry fun seal_approve_nft(
    id: vector<u8>,
    ticket: &PremiumTicketNFT,
    ctx: &TxContext
) {
    // トランザクションのsenderを取得（PTBのsenderと一貫性を保つ）
    let sender = tx_context::sender(ctx);
    
    // NFT所有確認ロジック
    // senderがticketを所有しているか確認
    // 所有していない場合はabort
    // Seal key serverがdry_run_transaction_blockで評価する
    
    // 注意: この関数は読み取り専用で実装する（storageを書き換えない）
}
```

### セッションJSONファイル構造

```json
{
  "sessions": [
    {
      "sessionId": "sha256-hash",
      "userAddress": "0x...",
      "nftId": "0x...",
      "blobId": "walrus-blob-id",
      "sessionKey": {
        "ephemeralPublicKey": "...",
        "ephemeralSecretKey": "...",
        "maxEpoch": 12345
      },
      // 注意: ephemeralSecretKeyを書き出すのはローカル開発のみ
      // 本番環境ではSessionKeyをサーバー側に永続化しない
      "txBytes": "0x...",
      "createdAt": 1234567890000,
      "expiresAt": 1234567920000
    }
  ]
}
```

**注意**: `decryptionKey`フィールドは存在しない（復号鍵はSeal key serverが管理し、アプリ側には露出しない）

### Seal暗号化オブジェクト構造

Seal SDKが生成する`encryptedObject`は、BCSシリアライズされた形式で保存されます。

**構造の説明**:
- **encryptedObject**: Seal SDKで生成された暗号化オブジェクト（BCSシリアライズ済み）
- **id**: Seal identity ID（アクセス制御ポリシーと紐付け）
- **packageId**: `seal_approve_nft`関数を含むMoveパッケージID
- **threshold**: 復号に必要なkey serverの数
- **services**: key serverの情報（object ID、重みなど）

**セキュリティ上の利点**:
- マスター鍵はSeal key serverが保持（アプリ側に鍵がない）
- データ改ざん検知は自動的に行われる（Seal SDKが処理）
- Seal公式の推奨方法に準拠

### 環境変数

```bash
# Seal設定
SEAL_KEY_SERVER_OBJECT_IDS=0x...,0x...  # Seal key serverのobject ID（カンマ区切り）
SEAL_PACKAGE_ID=0x...                   # seal_approve_nft関数を含むMoveパッケージID
SEAL_IDENTITY_ID=0x...                  # Seal identity ID（hex形式、package IDのprefixなし）
SEAL_THRESHOLD=2                        # 復号に必要なkey serverの数（OneTube は当面 2-of-3 相当を想定）
SEAL_SESSION_DURATION=60                # SessionKeyの有効期限（秒単位、最小1分=60秒、SealのttlMin制約のため）
                                        # 注意: この値はSeal key server側のTTL以下になるように設定する
                                        # バックエンドのexpiresAtはこの値以下で計算され、expiresAtを過ぎたらSealClient.decrypt()を呼ばない

# SealClient設定
VERIFY_KEY_SERVERS=false                # ローカル開発ではfalse（パフォーマンス優先）
                                        # 本番環境ではtrue（Key serverのなりすまし防止）

# Walrus設定
WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# 開発者モード
DEV_MODE=false                          # trueの場合のみ詳細ログを出力

# セッション管理
# sessions.jsonはローカル開発専用（.gitignoreに追加済み、リポジトリには含めない）
# 本番環境ではSessionKeyをサーバー側に永続化しない（client-side保存またはin-memory）
```

---

## 依存関係

### 既存実装への依存
- `app/src/server/seal.ts`: SealClientの初期化とSessionKey管理を実装
- `app/src/server/server.ts`: `/api/watch`と`/api/video`エンドポイントを拡張
- `contracts/sources/contracts.move`: `seal_approve_nft`関数を追加
- `scripts/commands/seed.ts`: テスト用NFTデータの準備

### 新規実装が必要なファイル
- `contracts/sources/contracts.move`: `seal_approve_nft`関数を追加（既存ファイルに追加）
- `contracts/tests/contracts_tests.move`: `seal_approve_nft`テストケースを追加（既存ファイルに追加）
- `scripts/encrypt-video.ts`: SealClientを使用した動画暗号化スクリプト
- `scripts/upload-to-walrus.ts`: Walrusアップロードスクリプト
- `app/src/server/seal.ts`: SealClientの初期化とSessionKey管理
- `app/src/server/walrus.ts`: Walrus HTTP API統合モジュール
- `app/src/lib/logger.ts`: 開発者モード対応ロガー
- `app/data/sessions.json`: セッション永続化ファイル（自動生成）
- `app/src/server/__tests__/seal.test.ts`: ユニットテスト
- `app/src/server/__tests__/seal-integration.test.ts`: 統合テスト

---

## 成功基準

### Phase 1成功基準
- [ ] SealClientを初期化できる
- [ ] SealClient.encrypt()を使用して動画を暗号化できる
- [ ] 暗号化オブジェクト（encryptedObject）をWalrusにアップロードし、BLOB IDを取得できる
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

## レビューチェックリスト

### 完全性
- [x] すべての必須セクションが完成している
- [x] ユーザーシナリオが明確である
- [x] 機能要件がテスト可能である
- [x] OneTube技術スタックとの整合性がある

### MVP方針との整合性
- [x] 必要最小限の機能に絞られている
- [x] 拡張性より実用性を優先している
- [x] テスト戦略が明確である

### 実装決定事項の反映
- [x] すべての意思決定事項が仕様書に反映されている
- [x] 技術的な詳細が具体的に記載されている
- [x] `seal_approve_nft`関数のコントラクトとテストケースが既存ファイルに追加されることが明記されている
- [x] Walrus APIの選択肢と推奨が記載されている
- [x] スクリプト設計の検討事項が記載されている



