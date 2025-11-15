# Walrus Testnet デプロイ手順。

## 0. 前提チェック

1. **Sui CLI / Walrus CLI** がインストール済みで、`sui --version`, `walrus --version` が通ること。
2. **アクティブな Sui アドレス**に十分な SUI (ガス用) と WAL (ストレージ用) があること。  
   ```bash
   sui client addresses
   sui client balance
   ```
3. `cd app & pnpm run dev` でフロントエンドの build が通る状態であること。

## 1. Sui & Walrus 設定

### 1.1 Sui クライアント設定を Testnet に合わせる

```bash
sui client envs          # testnet が Active であることを確認
sui client active-address
```

必要であれば `sui client switch --env testnet` を実行。
環境がまだない場合は、`sui client new-env --alias devnet --rpc https://fullnode.testnet.sui.io:443`を実行。

### 1.2 WAL 取得 (必要に応じて)

テストネットでの保存には WAL トークンが必要。手持ちが無ければ `walrus get-wal` で SUI→WAL を交換する。

```bash
walrus get-wal   # 0.5 SUI → 0.5 WAL など
sui client balance  # WAL が増えていることを確認

# 成功すると以下のようなログが出力される：
╭──────────────────────────────────────────╮
│ Balance of coins owned by this address   │
├──────────────────────────────────────────┤
│ ╭──────────────────────────────────────╮ │
│ │ coin       balance (raw)  balance    │ │
│ ├──────────────────────────────────────┤ │
│ │ Sui        1471434856     1.47 SUI   │ │
│ │ WAL Token  466575000      0.46 WAL   │ │
│ ╰──────────────────────────────────────╯ │
╰──────────────────────────────────────────╯
```

### 1.3 Walrus CLI の multi-config を取得

例えば公式サンプルの client_config をダウンロードしておく：

```bash
curl --create-dirs https://docs.wal.app/setup/client_config.yaml \
  -o ~/.config/walrus/client_config.yaml
```

`walrus info --context testnet` が通れば OK。

## 2. site-builder の設定

`~/.config/walrus/sites-config.yaml` に testnet コンテキストを用意し、`default_context` も testnet にする。

```yaml
contexts:
  testnet:
    package: 0xf99a...
    staking_object: 0xbe46...
    general:
      wallet_env: testnet
      walrus_context: testnet
      walrus_package: 0xd847...
default_context: testnet
```

> 💡 mainnet セクションはそのままでも良いが、Testnet デプロイ時に `wallet_env: mainnet` の設定を参照してしまうと「Env 'mainnet' not found...」で失敗するため、必ず default を testnet にしておく。

## 3. SPA 用ルーティング設定（必要な場合）

`app/dist/ws-resources.json` に React Router 用フォールバック（`"/*": "/index.html"`）を設定。  
※ `dist` ディレクトリはビルド後に生成されるので、ビルドしてから配置するか、ビルドスクリプトでコピーするようにする。

```json
{
  "site_name": "one-tube-wal",
  "object_id": "0xfedf39ff80c523ad129f5424e734a1e5ceade56f39f6db1dc6115889caecf1e5",

  // 以下を追加する
  "routes": {
    "/*": "/index.html"
  }

}

```

既存サイトに同じ route が登録済みの場合、`insert_route` の MoveAbort が発生する。新規サイトを作るか、`walrus site routes remove` コマンドで古いルートを削除してからデプロイする（後者は CLI の `site` サブコマンドを利用する）。

## 4. ビルド


```bash
cd app
pnpm install
pnpm run build
ls -l dist/index.html
```

ここまででエラーが無いことを確認。

## 5. site-builder で Testnet デプロイ

`dist` を持つ `app` ディレクトリで実行する（ルートで実行すると `./dist` が見つからないため注意）。

```bash
cd app
site-builder --config ~/.config/walrus/sites-config.yaml \
  deploy ./dist --epochs 1
```

- `--epochs` は保存したいエポック数 (>=1)。  
- 途中で `No such file or directory` が出た場合は作業ディレクトリを `dist` がある場所にして再実行。  
- `insert_route` MoveAbort が出た場合は §3 を参照。

成功すると以下のようなログが出力される：

```
// 中略
Parsing the directory ./dist and locally computing blob IDs ... [Ok]
Storing resources on Walrus: batch 1 of 1 ... [Ok]
Applying the Walrus Site object updates on Sui ... [Ok]
2025-11-13T09:21:41.272718Z  INFO site_builder::publish: New site published. New ObjectID (0xfedf39ff80c523ad129f5424e734a1e5ceade56f39f6db1dc6115889caecf1e5) will be persisted in ws-resources.json.
Creating ws-resources.json (Site Object ID: 0xfedf39ff80c523ad129f5424e734a1e5ceade56f39f6db1dc6115889caecf1e5, Name: Some("My Walrus Site")) at: ./dist/ws-resources.json ... [Ok]
fig: saving Walrus site resources file=./dist/ws-resources.json
Execution completed
Resource operations performed:
created resource /assets/index-B5xsVMJO.css with blob ID lnC7eNwGnniWeQp_BClNx2x1VvDJnAAvkSA9ne1gQsI
created resource /assets/index-DUdMh-EL.js with blob ID l0WgyEgdIIyhiq_b2EkGH0e9eFEeLZW4Ve2Kj4HCa9o
created resource /index.html with blob ID NNVfJZx5dLYYjSqTThrMkLReFBmViMIsLjE8t3iYx2o
The site routes were left unchanged.
No Metadata updated.
Site name has not been updated.
Created new site!
New site object ID: 0xfedf39ff80c523ad129f5424e734a1e5ceade56f39f6db1dc6115889caecf1e5
⚠️ wal.app only supports sites deployed on mainnet.
To browse your testnet site, you need to self-host a portal:
1. For local development: http://6coq0f1ezog19yx9du64uw8p9ssdlzo2g76366tjiz0m7e7f1h.localhost:3000
2. For public sharing: http://6coq0f1ezog19yx9du64uw8p9ssdlzo2g76366tjiz0m7e7f1h.yourdomain.com:3000
📖 Setup instructions: https://docs.wal.app/walrus-sites/portal.html#running-the-portal-locally

💡 Tip: You may also bring your own domain (https://docs.wal.app/walrus-sites/bring-your-own-domain.html) or find third-party hosted testnet portals.
```

testnet では `wal.app` ポータルから直接閲覧できないので、ログに表示されるローカル/独自ドメイン向けポータル URL を使う。

## 6. 失敗時の典型パターンと対処

| 症状 | 対処 |
| --- | --- |
| `Env 'mainnet' not found in wallet config` | `sites-config.yaml` の default_context を testnet にする。Walrus config / Sui wallet が testnet context を持っているか確認。 |
| `No such file or directory (./dist)` | `dist` が存在するディレクトリに移動してから site-builder を実行する。 |
| `MoveAbort ... insert_route` | 既存サイトに同じルートがある。`walrus site routes remove --route "/*"` などで掃除するか、新しいサイトとして発行する。 |
| `tsconfig.node.json ... allowImportingTsExtensions` | `compilerOptions.noEmit: true` を追加して tsc を型チェック専用にする。 |

## 7. まとめ

1. Sui/Walrus の testnet context を整える（SUI/WAL 残高、config、default context）。
2. `pnpm run build` → `dist` & `ws-resources.json` を確認。
3. `app` ディレクトリで `site-builder ... deploy ./dist --epochs N` を実行。
4. 出力された Site Object ID とポータル URL を記録する（`dist/ws-resources.json` にも保存される）。

これで再デプロイが安定して行える。
