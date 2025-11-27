# OneTube フロントエンド 現状仕様書（コード・UI実装準拠）

本書は、リポジトリ内の実装済みコード・UIのみを根拠とした現状仕様の整理です。推測や未実装の要件は含みません。

---

## 1. 全体構成 / ページ構造（現状のまま）

- ルーティング構成
  - `/` → `/tickets` にリダイレクト
  - `/tickets`（チケット一覧）
  - `/videos`（動画アーカイブ＋プレイヤー＋詳細）
  - `/videos/:videoId`（単体動画詳細）
  - 参照: `app/src/App.tsx:89`
- 共通レイアウト
  - 全ページで `Header` + 左 `Sidebar` + 右メインの2ペイン構成
  - Videosページ表示中のみメイン領域 `overflow: hidden`、それ以外 `auto`
  - 参照: `app/src/App.tsx:81`, `app/src/App.tsx:88`
- OAuthデバッグ（zkLogin）
  - URLハッシュに `id_token` がある場合、デバッグ時のみ `/api/debug/zklogin` を呼び出しログ表示。続いて `handleAuthCallback()` 実行
  - 参照: `app/src/App.tsx:35`, `app/src/App.tsx:47`, `app/src/App.tsx:58`

テキスト図解
```
Header
┌───────────────────────────────────────────────────────────────┐
│ Sidebar (320px) │                Main                        │
│ - TICKETS        │ - Routes (/tickets, /videos, /videos/:id) │
│ - VIDEOS         │ - Content scroll/overflow per page        │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. コンポーネント一覧（現状コードベース）

- レイアウト
  - `Header`（ロゴ、ネットワーク選択UI、ログイン/ログアウト、ログインモーダル）
    - state/hooks: `useCurrentAccount`, `useDisconnectWallet`, `currentNetwork`, `isLoginModalOpen`
    - 動作:
      - Loginボタン→`LoginModal` 表示
      - Logoutボタン→ウォレット切断＋`enoki.logout()`試行＋`toast`表示
      - ネットワーク選択は内部stateのみ（`SuiClientProvider`切替は未実装）
    - 参照: `app/src/components/Header.tsx:120`, `app/src/components/Header.tsx:126`, `app/src/components/Header.tsx:132`
  - `Sidebar`（ナビゲーション）
    - props: `currentPage: "tickets" | "videos"`
    - 動作: 現在ページを強調表示。ボタンhover時の背景色変更
    - 参照: `app/src/components/Sidebar.tsx:12`

- ページ
  - `TicketsPage`（チケット一覧）
    - データ: `MOCK_TICKETS`（ローカルstate保持）
    - ログイン状態に応じた所有フラグの自動調整（id `"1"` をログイン時に所有化）
    - `Refresh` ボタンで初期化（ルール適用）
    - `BUY PREMIUM TICKET` クリックで擬似購入（500ms待ち→所有化→`localStorage("ownedTickets")` 追記→`toast`）
    - 参照: `app/src/pages/TicketsPage.tsx:10`, `app/src/pages/TicketsPage.tsx:61`, `app/src/mocks/tickets.ts:33`
  - `VideosPage`（動画アーカイブ＋プレイヤー＋詳細）
    - 初回に最初の動画を自動選択
    - 所有判定: `isLoggedIn && ownedTickets.length > 0`（動画個別の所有ではなく件数>0）
    - `Play Preview`：常時再生可（プレビューURL）
    - `Watch Full Version`：所有時のみ活性。擬似セッション取得（`toast`→待機）後、完全版URLで再生
    - `localStorage("ownedTickets")` を1秒間隔でポーリングし反映
    - 参照: `app/src/pages/VideosPage.tsx:85`, `app/src/pages/VideosPage.tsx:96`, `app/src/pages/VideosPage.tsx:101`, `app/src/pages/VideosPage.tsx:37`
  - `VideoDetailPage`（単体動画）
    - モック固定データを `useEffect` で設定。`hasPremiumTicket` は常に `false` のため、完全版は視聴不可
    - 参照: `app/src/pages/VideoDetailPage.tsx:20`, `app/src/pages/VideoDetailPage.tsx:17`

- UI部品
  - `TicketCard`
    - props: `{ ticket, onPurchase?, isPurchasing? }`
    - 表示: OWNED/NOT OWNEDバッジ、価格情報、残数、ボタン2種（所有状況/在庫で活性/非活性切替）
    - 参照: `app/src/components/TicketCard.tsx:1`
  - `VideoCard`
    - props: `{ video, isSelected?, onClick?, hasPremiumTicket? }`
    - 表示: サムネ（所有無はグレースケール）、左上に `TicketIcon`、右下に「10s」と「PREVIEW ONLY」バッジ
    - 参照: `app/src/components/VideoCard.tsx:1`, `app/src/components/VideoCard.tsx:142`
  - `VideoPlayer`
    - props: `{ videoUrl?, isPlaying?, onPlay?, onPause? }`
    - 機能: 再生/一時停止は実装済み。巻戻し/早送り/音量/フルスクリーンは見た目のみ（機能割当なし）
    - 参照: `app/src/components/VideoPlayer.tsx:16`, `app/src/components/VideoPlayer.tsx:231`
  - `VideoTitleSection`
    - 通常/プレミアムいいね（プレミアムは所有時のみクリック可）
    - 参照: `app/src/components/VideoTitleSection.tsx:1`, `app/src/components/VideoTitleSection.tsx:106`
  - `VideoInfo`
    - 各種メタ（uploadDate/athletes/venue/duration/blobId/walruscanUrl）を文字列表示
    - 参照: `app/src/components/VideoInfo.tsx:1`
  - `PremiumTicketPrompt`
    - `hasPremiumTicket` が true の場合は非表示
    - 参照: `app/src/components/PremiumTicketPrompt.tsx:1`
  - `CommentForm`
    - テキスト入力のみ、Submitは常時 `disabled`（開発中メッセージ）
    - 参照: `app/src/components/CommentForm.tsx:1`
  - `LoginModal`
    - `Connect Wallet`押下で、非表示の `ConnectButton` をプログラムクリックしウォレットUIを表示
    - 参照: `app/src/components/LoginModal.tsx:19`

- 未使用コンポーネント
  - `components/ui/DropdownMenu.tsx`（DropdownMenu/DropdownMenuItem 定義あり、使用箇所なし）
  - 参照: `app/src/components/ui/DropdownMenu.tsx:17`

---

## 3. データモデル（Mock含む：コードから抽出）

- MockTicket（`app/src/mocks/tickets.ts:1`）
  - フィールド: `id`, `eventTitle`, `fighter1`, `fighter2`, `location`, `physicalTicketPrice`, `premiumPrice`, `premiumFee`, `remainingTickets`, `isAvailable`, `isPremiumOwned`, `leftImageUrl`, `rightImageUrl`, `previewUrl?`, `fullVideoUrl?`
- MOCK_TICKETS（12件）（`app/src/mocks/tickets.ts:33`）
  - id規則（UI副作用に依存）:
    - `"1"`: ログイン時、所有化（TicketsPageの副作用）
    - `"2"`: 購入体験用（購入で所有化、ログアウトで解除）
    - `"3"`: 売切（`isAvailable: false`）
- MockVideo（`app/src/mocks/videos.ts:1`）
  - フィールド: `id`, `title`, `description`, `thumbnailUrl`, `previewUrl?`, `fullVideoUrl?`, `requiresPremium`
- 共通型（`app/src/shared/types.ts:1`）
  - `PremiumTicketNFT`, `Video`, `Session`, `SessionMetadata`, `PurchaseRequest/Response`, `WatchRequest/Response`, `VideoContentResponse`, `HealthResponse` ほか
- 補足
  - `TicketData`（`app/src/types/ticket.ts:1`）: 表示用チケット型（`listingId?` など）
  - 動画メタ: `app/src/assets/videos.json`（Server 側で参照）

---

## 4. ページ別 UI / 挙動仕様

### Ticketsページ（`/tickets`）
- ヘッダー: 「AVAILABLE TICKETS」＋「Refresh」ボタン
  - 参照: `app/src/pages/TicketsPage.tsx:116`
- グリッド: `repeat(auto-fit, minmax(320px, 1fr))`
  - 参照: `app/src/pages/TicketsPage.tsx:212`
- 所有状態と購入
  - ログイン時: id `"1"` を所有化
  - ログアウト時: id `"2"` を未所有化＋`localStorage("ownedTickets")`から `"2"` を除外
  - Refresh: 上記ルールで初期化（未ログイン時 `"2"` をLSから除外）
  - 購入（擬似）: ログイン必須→0.5秒後に対象チケット `isPremiumOwned=true` に更新→`localStorage("ownedTickets")` にID追加→`toast.success`
  - 参照: `app/src/pages/TicketsPage.tsx:21`, `app/src/pages/TicketsPage.tsx:25`, `app/src/pages/TicketsPage.tsx:38`, `app/src/pages/TicketsPage.tsx:61`

### Videosページ（`/videos`）
- 左カラム（383px固定）に動画リスト、右にプレイヤー＋詳細
  - 参照: `app/src/pages/VideosPage.tsx:200`, `app/src/pages/VideosPage.tsx:283`
- 動画選択
  - 初回に最初の動画を自動選択
  - 参照: `app/src/pages/VideosPage.tsx:90`
- 視聴制御
  - 所有判定: `isLoggedIn && ownedTickets.length > 0`（動画/チケットIDとは非連動）
  - プレビュー再生: 常時可（`previewUrl`）
  - 完全版再生: 所有時のみ活性。`toast.info("Getting session key")`→1秒待機→`toast.success`→0.5秒待機→完全版URL（`fullVideoUrl`）で再生
  - 参照: `app/src/pages/VideosPage.tsx:85`, `app/src/pages/VideosPage.tsx:96`, `app/src/pages/VideosPage.tsx:101`, `app/src/pages/VideosPage.tsx:121`
- 所有状態の同期
  - ログイン時 `"1"` をLSへ追加、ログアウト時 `"1"` と `"2"` をLSから削除
  - 他タブ更新対応のため `localStorage("ownedTickets")` を1秒間隔ポーリング
  - 参照: `app/src/pages/VideosPage.tsx:67`, `app/src/pages/VideosPage.tsx:75`, `app/src/pages/VideosPage.tsx:37`
- 付帯UI
  - `PremiumTicketPrompt`: 非所有時のみ表示
  - `VideoTitleSection`: 通常/プレミアムいいね（プレミアムは非所有時 `cursor: not-allowed`）
  - `VideoInfo`: 固定値を表示（ページ内で与えられたprops）
  - 参照: `app/src/pages/VideosPage.tsx:394`, `app/src/pages/VideosPage.tsx:412`, `app/src/pages/VideosPage.tsx:418`

### Video詳細ページ（`/videos/:videoId`）
- モック固定データをセットし、`hasPremiumTicket=false` 固定（完全版視聴不可）
- プレビュー再生ボタンのみ実用
- 参照: `app/src/pages/VideoDetailPage.tsx:17`, `app/src/pages/VideoDetailPage.tsx:20`

---

## 5. レスポンシブ挙動（現状ベース）

- Ticketsページの余白のみCSSでブレークポイント対応
  - PC: 32px / タブレット: 24px / モバイル: 16px
  - 参照: `app/src/styles/TicketsPageResponsive.css:8`
- Sidebar（320px固定）や Videosページの左右幅（383px/672px）は固定値のため、狭幅時の最適化は未実装
  - 参照: `app/src/components/Sidebar.tsx:19`, `app/src/pages/VideosPage.tsx:200`, `app/src/pages/VideosPage.tsx:289`

---

## 6. API / Mock挙動

- 実際に呼ばれているエンドポイント（現UI）
  - `GET /api/debug/zklogin?id_token=...`（デバッグモード時、URLハッシュに `id_token` がある場合のみ）
  - 参照: `app/src/App.tsx:47`, `app/vite.config.ts:9`
- 定義済みだが現UIから未使用のAPI
  - `GET /api/health`
  - `POST /api/purchase`（Sponsored Tx でKiosk購入）
  - `POST /api/watch`（所有確認→セッション作成。レスポンスは `session` メタのみ）
  - `GET /api/video?session=...`（セッション検証→復号URL返却）/ `GET /api/video?nftId=...`（プレビューURL返却）
  - `GET /api/listings`（Kiosk出品リスト）
  - 参照: `app/src/server/server.ts:23`, `app/src/server/server.ts:89`, `app/src/server/server.ts:125`, `app/src/server/server.ts:240`, `app/src/server/server.ts:308`
- サーバ実装のモックデータ/補助
  - 動画URL解決: `app/src/assets/videos.json` を参照（`server/videos.ts`）
  - セッション管理: メモリ保持＋期限切れクリーンアップ（`server/seal.ts`）
  - 参照: `app/src/server/videos.ts:1`, `app/src/server/seal.ts:72`

---

## 7. 制御フロー（ユーザー操作 → UI更新）

- ログイン（Wallet）
  - Header「Login」→ `LoginModal` 表示 → 「Connect Wallet」→ 非表示の `ConnectButton` をクリック → ウォレット接続 → `useCurrentAccount` 更新 → Headerがアドレス表示に切替
  - 参照: `app/src/components/LoginModal.tsx:39`, `app/src/components/Header.tsx:169`
- ログアウト
  - 「Logout」→ `useDisconnectWallet()` + `enoki.logout()`（try） + `toast.success("Logged out")`
  - 参照: `app/src/components/Header.tsx:147`
- チケット購入（擬似）
  - 未ログイン: `toast.info("Please log in...")`
  - ログイン: 500ms待機 → 対象チケット `isPremiumOwned=true` → `localStorage("ownedTickets")` にID追加 → `toast.success`
  - 参照: `app/src/pages/TicketsPage.tsx:61`
- 完全版視聴（擬似）
  - 所有判定（`isLoggedIn && ownedTickets.length > 0`）成立時のみボタン活性
  - クリック→`toast.info("Getting session key")`→1秒待機→`toast.success("Session valid...")`→0.5秒待機→`isFullVersion=true` で再生
  - 参照: `app/src/pages/VideosPage.tsx:101`
- OAuthデバッグ
  - URLハッシュの `id_token` 検出 → `/api/debug/zklogin` コール → `handleAuthCallback()` → ハッシュ削除
  - 参照: `app/src/App.tsx:35`, `app/src/App.tsx:58`

---

## 8. 現状の問題点（コードとUIの差異など）

- Google zkLogin 未接続
  - 「Log in with Google」は `toast.info`のみ。`lib/enoki.ts:loginWithGoogle()` はUIから未呼出
  - 参照: `app/src/components/Header.tsx:142`, `app/src/lib/enoki.ts:21`
- 完全版視聴フローがローカル擬似
  - `POST /api/watch` → `GET /api/video` 連携は未使用で、`toast`とstateで疑似再生
  - 参照: `app/src/pages/VideosPage.tsx:101`
- 所有判定の粒度
  - `ownedTickets.length > 0` でページ全体の完全版が開放される仕様（動画や特定チケットとの対応付けは無い）
  - 参照: `app/src/pages/VideosPage.tsx:85`
- `VideoDetailPage` の不整合
  - `hasPremiumTicket=false` 固定で、ログインや所有状態に連動しない
  - 参照: `app/src/pages/VideoDetailPage.tsx:17`
- ネットワーク切替UIは見た目のみ
  - `SuiClientProvider` のネットワーク切替未実装（TODOコメントあり）
  - 参照: `app/src/components/Header.tsx:132`
- 一部ボタンは見た目のみ
  - プレイヤーの巻戻し/早送り/音量/フルスクリーンはイベント未実装（クリックで動作しない）
  - 参照: `app/src/components/VideoPlayer.tsx:231`, `app/src/components/VideoPlayer.tsx:297`, `app/src/components/VideoPlayer.tsx:323`, `app/src/components/VideoPlayer.tsx:348`
- レイアウトの固定幅
  - `Sidebar` 320px、Videosの左右（383px/672px）が固定。狭幅画面の最適化は未実装
  - 参照: `app/src/components/Sidebar.tsx:19`, `app/src/pages/VideosPage.tsx:200`, `app/src/pages/VideosPage.tsx:289`
- 未使用コンポーネント
  - `components/ui/DropdownMenu.tsx` は定義のみで未使用

---

## 9. 改善案（現状仕様とは分離）

- 認証連携の有効化
  - Header「Log in with Google」→ `lib/enoki.ts:loginWithGoogle()` に接続し、`handleAuthCallback()` と整合
- 所有検証の実API化
  - 購入 → `POST /api/purchase` を使用（UIの擬似購入から移行）
  - 完全版視聴 → `POST /api/watch` → レスポンスの `session.sessionUrl` を使用し `GET /api/video?session=...` でURL取得して再生
- 所有判定の粒度改善
  - 動画とチケットの対応付け（該当チケットの所有時のみ対象動画の完全版を解放）
- ページ間の整合
  - `VideosPage` と `VideoDetailPage` の所有/視聴ロジック統一（LS擬似→API化と共に共通hook化）
- ネットワーク切替の実装
  - `Header` の選択に合わせ `SuiClientProvider` のデフォルトネットワークを切替
- レイアウト/レスポンシブ
  - SidebarとVideos右ペインの固定幅を可変化し、ブレークポイントを導入
- プレイヤー操作の機能割当
  - 巻戻し/早送り/音量/フルスクリーンの実装追加（または非表示）

---

### ファイル参照（開始行）

- ルーティング/レイアウト: `app/src/App.tsx:81`, `app/src/App.tsx:88`, `app/src/App.tsx:89`
- Tickets: `app/src/pages/TicketsPage.tsx:10`, モック: `app/src/mocks/tickets.ts:1`
- Videos: `app/src/pages/VideosPage.tsx:14`, モック: `app/src/mocks/videos.ts:1`
- VideoDetail: `app/src/pages/VideoDetailPage.tsx:13`
- Header: `app/src/components/Header.tsx:120`, LoginModal: `app/src/components/LoginModal.tsx:11`
- Sidebar: `app/src/components/Sidebar.tsx:12`
- VideoCard: `app/src/components/VideoCard.tsx:1`, TicketIcon: `app/src/components/TicketIcon.tsx:1`
- VideoPlayer: `app/src/components/VideoPlayer.tsx:16`
- VideoTitleSection: `app/src/components/VideoTitleSection.tsx:1`, VideoInfo: `app/src/components/VideoInfo.tsx:1`, PremiumTicketPrompt: `app/src/components/PremiumTicketPrompt.tsx:1`
- CommentForm: `app/src/components/CommentForm.tsx:1`
- Enoki: `app/src/lib/enoki.ts:1`, API: `app/src/lib/api.ts:11`, Sui: `app/src/lib/sui.ts:1`, Toast: `app/src/lib/toast.ts:1`
- サーバ: `app/src/server/server.ts:1`, `app/src/server/seal.ts:1`, `app/src/server/kiosk.ts:1`, `app/src/server/sponsor.ts:1`, `app/src/server/videos.ts:1`
- レスポンシブCSS: `app/src/styles/TicketsPageResponsive.css:8`

以上。現状の実装に忠実な仕様書です。必要なら、API連携の導入とVideoDetailの仕様統一から実装を進められます。

---

## 10. モックUI画像 / ディレクトリ（TicketCard / VideosPage）

- ローカル（public 配下 → ルート `/assets/...` で配信）
  - アバター: `app/public/assets/avatars` → `/assets/avatars/*`
    - 使用箇所: TicketCard 左右選手画像（`getFighterImageUrl()`）
    - 参照: `app/src/mocks/tickets.ts`
    - 対応ファイル例（実在確認済み）:
      - `Fabricio_Andrade.png`, `Enkh-Orgil.png`, `Tawanchai.png`, `Liu_Mengyang.png`, `Zhang_Peimian.png`, `generic_male.png` ほか
  - サムネイル: `app/public/assets/thumbnails` → `/assets/thumbnails/*`
    - 使用箇所: VideosPage の VideoCard サムネイル（`MOCK_VIDEOS`）
    - 実ファイル:
      - `20251028-KiamrianAbbasov-vs-ChristianLee.png`
      - `20250323-Superlek-vs-Kongthoranee.png`
      - `20240906-Haggerty-vs-Mongkolpetch.png`
  - 動画: `app/public/assets/videos` → `/assets/videos/*`
    - 使用箇所: VideosPage の `previewUrl`/`fullVideoUrl`
    - 実ファイル:
      - `preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
      - `full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`

- リモート（Figma アセット URL）
  - TicketsPage Refresh アイコン: `app/src/pages/TicketsPage.tsx`
  - VideosPage Play アイコン: `app/src/pages/VideosPage.tsx`
  - VideoPlayer 各種アイコン: `app/src/components/VideoPlayer.tsx`
  - TicketIcon ベクタ画像: `app/src/components/TicketIcon.tsx`

- 画像パス生成の仕様（TicketCard）
  - `getFighterImageUrl(fighterName)` → `/assets/avatars/<mapped>.png`（`app/src/mocks/tickets.ts`）
  - マッピング（抜粋）:
    - "Fabricio Andrade" → `Fabricio_Andrade.png`
    - "Enkh-Orgil Baatarkhuu" → `Enkh-Orgil.png`
    - "Tawanchai PK Saenchai" → `Tawanchai.png`
    - "Liu Mengyang" → `Liu_Mengyang.png`
    - "Zhang Peimian" → `Zhang_Peimian.png`
    - 上記以外（定義のない選手名）は `generic_male.png`

- 画像/動画 URL の設定箇所
  - `MOCK_TICKETS` の `previewUrl`/`fullVideoUrl`: `app/src/mocks/tickets.ts`
  - `MOCK_VIDEOS` の `thumbnailUrl`/`previewUrl`/`fullVideoUrl`: `app/src/mocks/videos.ts`

### 10.1 TicketCard で実際に表示されるローカル画像パス（モック基準）

- 各カードの左右画像（`/assets/avatars/...`）
  - id "1": 左 `/assets/avatars/Fabricio_Andrade.png`、右 `/assets/avatars/Enkh-Orgil.png`
  - id "2": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "3": 左 `/assets/avatars/Tawanchai.png`、右 `/assets/avatars/Liu_Mengyang.png`
  - id "4": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "5": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "6": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "7": 左 `/assets/avatars/Zhang_Peimian.png`、右 `/assets/avatars/generic_male.png`
  - id "8": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "9": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "10": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "11": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`
  - id "12": 左 `/assets/avatars/generic_male.png`、右 `/assets/avatars/generic_male.png`

（根拠: `app/src/mocks/tickets.ts` の `getFighterImageUrl()` マッピングと各 `MOCK_TICKETS` の `fighter1`/`fighter2`）

### 10.2 VideosPage で実際に表示されるローカル画像/動画パス（モック基準）

- サムネイル（`/assets/thumbnails/...`）
  - video id "1": `/assets/thumbnails/20251028-KiamrianAbbasov-vs-ChristianLee.png`
  - video id "2": `/assets/thumbnails/20250323-Superlek-vs-Kongthoranee.png`
  - video id "3": `/assets/thumbnails/20240906-Haggerty-vs-Mongkolpetch.png`

- 動画（`/assets/videos/...`）
  - video id "1":
    - preview: `/assets/videos/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
    - full: `/assets/videos/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
  - video id "2":
    - preview: `/assets/videos/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
    - full: `/assets/videos/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
  - video id "3":
    - preview: `/assets/videos/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`
    - full: `/assets/videos/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`

（根拠: `app/src/mocks/videos.ts` の `MOCK_VIDEOS`）

### 10.3 VideoDetailPage で実際に使用しているローカル動画パス（モック基準）

- プレビュー動画（絶対URL・ローカルホスト配信）
  - `http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4`

（根拠: `app/src/pages/VideoDetailPage.tsx:28`）
