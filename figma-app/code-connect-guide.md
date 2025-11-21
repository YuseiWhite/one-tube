# Figma Code Connect セットアップガイド

このガイドでは、Figma Code Connectを使用してFigmaデザインとコードを接続する方法を、エンジニア以外の方にもわかりやすく説明します。

## 📋 目次

1. [Code Connectとは](#code-connectとは)
2. [事前準備](#事前準備)
3. [設定手順（ステップバイステップ）](#設定手順ステップバイステップ)
4. [Figmaでの使い方](#figmaでの使い方)
5. [トラブルシューティング](#トラブルシューティング)

---

## Code Connectとは

Figma Code Connectは、Figmaのデザインコンポーネントと実際のコード（Reactコンポーネント）を接続する機能です。

**メリット：**
- ✅ デザインとコードが自動的に同期
- ✅ Figmaでコンポーネントを選択すると、対応するコードが表示される
- ✅ デザイナーとエンジニアの連携がスムーズになる

**必要なもの：**
- Figmaのビジネスプランまたはエンタープライズプラン
- Figmaファイルへのアクセス権限
- このプロジェクトのコードへのアクセス権限

---

## 事前準備

### 1. Figmaファイルの確認

Code Connectを使用するには、Figmaファイルに**コンポーネント（Component）**が作成されている必要があります。

**確認方法：**
1. Figmaファイルを開く
2. 左側のレイヤーパネルで、コンポーネントアイコン（4つの点が四角形に並んだアイコン）があるか確認
3. コンポーネントがない場合は、デザイナーに依頼して作成してもらう

**必要なコンポーネント：**
- Button
- Header
- TicketCard
- VideoCard
- Sidebar
- その他のUIコンポーネント

### 2. プロジェクトの確認

このプロジェクトには、以下のファイルが既に設定されています：

- ✅ `figma.config.js` - Code Connectの設定ファイル
- ✅ `package.json` - Code Connect用のスクリプト
- ✅ 各コンポーネントファイル - Code Connectアノテーションが追加済み

---

## 設定手順（ステップバイステップ）

### ステップ1: FigmaファイルのURLを取得

1. **Figmaファイルを開く**
   - ブラウザでFigmaを開く
   - Code Connectを設定したいFigmaファイルを開く

2. **URLをコピー**
   - ブラウザのアドレスバーからURLをコピー
   - 例：`https://www.figma.com/file/ABC123XYZ/MyDesign`

3. **ファイルキーを確認（オプション）**
   - URLの`/file/`の後にある文字列がファイルキーです
   - 例：`ABC123XYZ`

### ステップ2: 環境変数ファイルを作成

1. **`.env`ファイルを作成**
   - `figma-app`フォルダ内に`.env`という名前のファイルを作成
   - テキストエディタで開く

2. **FigmaファイルのURLを設定**
   ```
   FIGMA_FILE_URL=https://www.figma.com/file/YOUR_FILE_KEY/YOUR_FILE_NAME
   ```
   
   **例：**
   ```
   FIGMA_FILE_URL=https://www.figma.com/file/ABC123XYZ/OneTube-UI-Design
   ```

3. **ファイルを保存**
   - `.env`ファイルを保存

**注意：** `.env`ファイルは機密情報を含む可能性があるため、Gitにコミットしないでください。

### ステップ3: Code Connectを実行

1. **ターミナルを開く**
   - プロジェクトのルートフォルダ（`one-tube`）でターミナルを開く

2. **figma-appフォルダに移動**
   ```bash
   cd figma-app
   ```

3. **Code Connectファイルを生成**
   ```bash
   pnpm figma:connect
   ```

4. **エラーがないか確認**
   - エラーが表示されないことを確認
   - エラーが出た場合は、[トラブルシューティング](#トラブルシューティング)を参照

5. **設定を検証（オプション）**
   ```bash
   pnpm figma:validate
   ```

### ステップ4: FigmaでCode Connectを有効化

1. **Figmaファイルを開く**
   - Code Connectを設定したいFigmaファイルを開く

2. **Dev Modeに切り替え**
   - 右上の「Dev Mode」ボタンをクリック
   - または、`Shift + D`キーを押す

3. **Code Connectを有効化**
   - 右上の設定アイコン（⚙️）をクリック
   - 「Code Connect」を有効にする

**注意：** Code Connectは、Figmaのビジネスプランまたはエンタープライズプランが必要です。

---

## Figmaでの使い方

### 基本的な使い方

1. **Dev Modeでコンポーネントを選択**
   - FigmaのDev Modeで、コンポーネントを選択
   - 例：Buttonコンポーネントを選択

2. **Code Connectパネルを確認**
   - 右側のパネルに「Code Connect」タブが表示される
   - タブをクリックして開く

3. **コードスニペットを確認**
   - コンポーネントに対応するコードが表示される
   - コードをコピーしてプロジェクトに使用できる

### コンポーネントのプロパティを変更する場合

1. **Figmaでコンポーネントを選択**
   - 変更したいコンポーネントを選択

2. **プロパティを変更**
   - 右側のパネルで、プロパティ（Variant、Size、Disabledなど）を変更

3. **コードを確認**
   - Code Connectパネルで、変更後のコードを確認
   - コードが自動的に更新される

### 対応しているコンポーネント

以下のコンポーネントがCode Connectに対応しています：

#### ページコンポーネント
- **Header** - ヘッダーコンポーネント
  - プロパティ：Wallet Connected、Wallet Address
- **Sidebar** - サイドバーコンポーネント
  - プロパティ：Active Page
- **TicketsPage** - チケット一覧ページ
  - プロパティ：Wallet Connected、Owned Tickets
- **VideosPage** - 動画一覧ページ
  - プロパティ：Wallet Connected、Owned Tickets
- **VideoPlayer** - 動画プレイヤー
  - プロパティ：Owned、Wallet Connected、Video Data

#### カードコンポーネント
- **TicketCard** - チケットカード
  - プロパティ：Owned、Ticket Data
- **VideoCard** - 動画カード
  - プロパティ：Owned、Selected、Video Data

#### UIコンポーネント
- **Button** - ボタン
  - プロパティ：Variant、Size、Disabled
- **Badge** - バッジ
  - プロパティ：Variant
- **Card** - カード
  - プロパティ：Content
- **Input** - 入力フィールド
  - プロパティ：Type、Placeholder、Disabled
- **Textarea** - テキストエリア
  - プロパティ：Placeholder、Disabled、Value
- **Dialog** - ダイアログ
  - プロパティ：Open
- **Checkbox** - チェックボックス
  - プロパティ：Checked、Disabled
- **Select** - セレクトボックス
  - プロパティ：Value、Size、Disabled
- **Tabs** - タブ
  - プロパティ：Default Value

---

## トラブルシューティング

### Code Connectが表示されない

**原因1: Dev Modeが有効になっていない**
- 解決方法：右上の「Dev Mode」ボタンをクリックして有効化

**原因2: Code Connectが有効になっていない**
- 解決方法：設定アイコン（⚙️）から「Code Connect」を有効にする

**原因3: コンポーネントが選択されていない**
- 解決方法：Code Connectに対応しているコンポーネントを選択する

**原因4: FigmaファイルのURLが設定されていない**
- 解決方法：`.env`ファイルに`FIGMA_FILE_URL`が設定されているか確認

### Code Connectファイルの生成に失敗する

**原因1: FigmaファイルのURLが間違っている**
- 解決方法：`.env`ファイルの`FIGMA_FILE_URL`を確認し、正しいURLを設定

**原因2: Figmaファイルへのアクセス権限がない**
- 解決方法：Figmaファイルへのアクセス権限があるか確認

**原因3: パッケージがインストールされていない**
- 解決方法：以下のコマンドを実行
  ```bash
  cd figma-app
  pnpm install
  ```

### コンポーネントがCode Connectに表示されない

**原因1: コンポーネント名が一致していない**
- 解決方法：Figmaのコンポーネント名が、コードのコンポーネント名と一致しているか確認
- 確認方法：`figma.config.js`の`figmaNodeName`を確認

**原因2: Code Connectアノテーションが追加されていない**
- 解決方法：エンジニアに依頼して、コンポーネントファイルに`figma.connect()`を追加してもらう

**原因3: プロパティ名が一致していない**
- 解決方法：Figmaのプロパティ名が、コードの`figmaPropName`と一致しているか確認

### コードが正しく表示されない

**原因1: プロパティのマッピングが間違っている**
- 解決方法：`figma.config.js`のプロパティマッピングを確認

**原因2: コンポーネントの構造が変更された**
- 解決方法：コード側のコンポーネント構造を確認し、必要に応じて更新

---

## よくある質問（FAQ）

### Q1: Code Connectを使うには、Figmaでコンポーネントを作成する必要がありますか？

**A:** はい、必要です。Code Connectは、Figmaのコンポーネント（Component）とコードのコンポーネントを接続する機能です。通常のフレームやレイヤーでは使用できません。

### Q2: コンポーネントを追加したい場合はどうすればいいですか？

**A:** エンジニアに依頼して、以下の作業を行ってもらってください：
1. コンポーネントファイルに`figma.connect()`を追加
2. `figma.config.js`にコンポーネントの設定を追加

### Q3: Code ConnectとDev Modeの「コードをコピー」機能の違いは何ですか？

**A:** 
- **Code Connect**: コンポーネントベースで、デザインとコードが自動的に同期
- **Dev Modeのコードコピー**: コンポーネント不要で、すぐにコードをコピーできる

詳細は、プロジェクトのドキュメントを参照してください。

### Q4: Code Connectは無料で使えますか？

**A:** Code Connectは、Figmaのビジネスプランまたはエンタープライズプランが必要です。無料プランでは使用できません。

### Q5: エラーが出た場合はどうすればいいですか？

**A:** [トラブルシューティング](#トラブルシューティング)セクションを参照してください。それでも解決しない場合は、エンジニアに相談してください。

---

## 参考資料

- [Figma Code Connect 公式ドキュメント](https://help.figma.com/hc/ja/articles/23920389749655-Code-Connect)
- [Code Connect API リファレンス](https://www.figma.com/plugin-docs/api/code-connect/)

---

## サポート

問題が発生した場合や質問がある場合は、エンジニアチームに相談してください。

