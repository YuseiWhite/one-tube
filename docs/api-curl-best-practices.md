# API curlコマンド ベストプラクティス

## 目次
1. [GETリクエスト](#getリクエスト)
2. [POSTリクエスト](#postリクエスト)
3. [エラーハンドリング](#エラーハンドリング)
4. [レスポンスのフォーマット](#レスポンスのフォーマット)
5. [プロジェクト固有のAPIエンドポイント](#プロジェクト固有のapiエンドポイント)

## GETリクエスト

### 基本形

```bash
# ✅ 推奨: 明示的に-Gフラグを使用（クエリパラメータを自動エンコード）
curl -G "http://localhost:3000/api/nfts" \
  --data-urlencode "userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"

# ✅ 推奨: -X GETを明示的に指定（デフォルトはGETだが明示的に）
curl -X GET "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"

# ⚠️ 動作するが推奨しない: クエリパラメータがURLエンコードされない可能性がある
curl "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
```

### なぜ`-G`フラグを使うべきか？

`-G`フラグは、`--data-urlencode`と組み合わせて使用すると、クエリパラメータを自動的にURLエンコードしてくれます：

```bash
# 特殊文字を含む場合でも安全
curl -G "http://localhost:3000/api/nfts" \
  --data-urlencode "userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" \
  --data-urlencode "filter=name:test video"
```

### 複数のクエリパラメータ

```bash
# ✅ 推奨: 複数のパラメータを個別に指定
curl -G "http://localhost:3000/api/nfts" \
  --data-urlencode "userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" \
  --data-urlencode "limit=10" \
  --data-urlencode "offset=0"
```

## POSTリクエスト

### JSONボディを含むPOSTリクエスト

```bash
# ✅ 推奨: Content-Typeヘッダーを明示的に指定
curl -X POST "http://localhost:3000/api/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6",
    "nftId": "0x2054e3ae94d6e4cafc6422148472b0b99223de98255cdfb19b408fe0849ff87e"
  }'

# ✅ 推奨: JSONファイルから読み込む（長いJSONの場合）
curl -X POST "http://localhost:3000/api/purchase" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### フォームデータ（application/x-www-form-urlencoded）

```bash
# application/x-www-form-urlencodedの場合
curl -X POST "http://localhost:3000/api/form-endpoint" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6&nftId=0x2054e3ae94d6e4cafc6422148472b0b99223de98255cdfb19b408fe0849ff87e"
```

## エラーハンドリング

### HTTPステータスコードの確認

```bash
# ✅ 推奨: HTTPステータスコードを確認
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X GET "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success"
  cat /tmp/response.json | jq .
else
  echo "❌ Error: HTTP $HTTP_CODE"
  cat /tmp/response.json
fi
```

### エラーメッセージの表示

```bash
# ✅ 推奨: エラー時にもレスポンスを表示
curl -X POST "http://localhost:3000/api/purchase" \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6", "nftId": "invalid"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

## レスポンスのフォーマット

### jqを使用したJSON整形

```bash
# ✅ 推奨: jqでJSONを整形
curl -s "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" | jq .

# 特定のフィールドのみ抽出
curl -s "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" | jq '.nfts[].id'
```

### サイレントモード（`-s`フラグ）

```bash
# ✅ 推奨: プログレスバーを非表示（スクリプトで使用する場合）
curl -s "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"

# デバッグ時は-sを外す（エラーメッセージが表示される）
curl "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
```

### 詳細なデバッグ情報（`-v`フラグ）

```bash
# デバッグ時: リクエスト/レスポンスヘッダーを表示
curl -v "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"

# より詳細な情報（`-vvv`）
curl -vvv "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
```

## プロジェクト固有のAPIエンドポイント

### 1. GET /api/health

```bash
# ✅ 推奨
curl -X GET "http://localhost:3000/api/health" | jq .

# シンプル版
curl -s "http://localhost:3000/api/health" | jq .
```

### 2. GET /api/listings

```bash
# ✅ 推奨
curl -X GET "http://localhost:3000/api/listings" | jq .

# 特定のフィールドのみ
curl -s "http://localhost:3000/api/listings" | jq '.listings[] | {id: .id, price: .price}'
```

### 3. GET /api/nfts

```bash
# ✅ 推奨: -Gフラグと--data-urlencodeを使用
curl -G "http://localhost:3000/api/nfts" \
  --data-urlencode "userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" \
  | jq .

# シンプル版（動作するが、URLエンコードされない可能性がある）
curl -s "http://localhost:3000/api/nfts?userAddress=0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6" | jq .
```

### 4. POST /api/purchase

```bash
# ✅ 推奨: Content-Typeヘッダーを明示的に指定
curl -X POST "http://localhost:3000/api/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6",
    "nftId": "0x2054e3ae94d6e4cafc6422148472b0b99223de98255cdfb19b408fe0849ff87e"
  }' \
  | jq .

# 変数を使用する場合
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
NFT_ID="0x2054e3ae94d6e4cafc6422148472b0b99223de98255cdfb19b408fe0849ff87e"

curl -X POST "http://localhost:3000/api/purchase" \
  -H "Content-Type: application/json" \
  -d "{
    \"userAddress\": \"$USER_ADDRESS\",
    \"nftId\": \"$NFT_ID\"
  }" \
  | jq .
```

### 5. POST /api/watch

```bash
# ✅ 推奨
curl -X POST "http://localhost:3000/api/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6",
    "nftId": "0x2054e3ae94d6e4cafc6422148472b0b99223de98255cdfb19b408fe0849ff87e"
  }' \
  | jq .
```

### 6. GET /api/video

```bash
# ✅ 推奨: -Gフラグと--data-urlencodeを使用
curl -G "http://localhost:3000/api/video" \
  --data-urlencode "sessionId=your-session-id" \
  | jq .

# シンプル版
curl -s "http://localhost:3000/api/video?sessionId=your-session-id" | jq .
```

## よく使うcurlフラグ一覧

| フラグ | 説明 | 使用例 |
|--------|------|--------|
| `-X METHOD` | HTTPメソッドを指定 | `-X GET`, `-X POST` |
| `-H "Header: value"` | ヘッダーを指定 | `-H "Content-Type: application/json"` |
| `-d "data"` | リクエストボディを指定 | `-d '{"key": "value"}'` |
| `-G` | クエリパラメータとしてデータを送信 | `-G --data-urlencode "key=value"` |
| `--data-urlencode` | URLエンコードして送信 | `--data-urlencode "key=value"` |
| `-s` | サイレントモード（プログレスバー非表示） | `curl -s "url"` |
| `-v` | 詳細モード（ヘッダー表示） | `curl -v "url"` |
| `-w "format"` | カスタム出力フォーマット | `-w "\nHTTP Status: %{http_code}\n"` |
| `-o file` | レスポンスをファイルに保存 | `-o response.json` |
| `-i` | レスポンスヘッダーを含めて表示 | `curl -i "url"` |

## まとめ

### GETリクエストのベストプラクティス

1. **`-G`フラグと`--data-urlencode`を使用**（クエリパラメータを安全にエンコード）
2. **`-X GET`を明示的に指定**（可読性向上）
3. **`-s`フラグでサイレントモード**（スクリプトで使用する場合）
4. **`jq`でJSONを整形**（可読性向上）

### POSTリクエストのベストプラクティス

1. **`Content-Type: application/json`ヘッダーを明示的に指定**
2. **JSONボディは`-d`フラグで指定**
3. **長いJSONはファイルから読み込む**（`-d @file.json`）
4. **エラーハンドリングを実装**（HTTPステータスコードの確認）

### デバッグ時のベストプラクティス

1. **`-v`フラグで詳細情報を表示**
2. **`-w`フラグでHTTPステータスコードを確認**
3. **`jq`でレスポンスを整形**
4. **エラーメッセージを確認**