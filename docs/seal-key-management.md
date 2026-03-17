# Seal キー管理ガイド

## 概要

Seal SDKでは、Ed25519Keypairを使用して署名と復号を行います。マスターキーとパブリックキーは、それぞれ異なる形式で保存する必要があります。

## userAddress とは

**userAddress**は、Ed25519Keypairの公開鍵から導出された**Suiアドレス**です。

**取得方法**:
```typescript
const userAddress = userKeypair.getPublicKey().toSuiAddress();
```

**形式**:
- **Suiアドレス**（`0x...`形式）
- 長さ: 66文字（`0x` + 64文字のhex）
- 例: `0x95dfd19d5ba1d4f7e247f89c66632d0692143c1fa70a342b69311e675162840d`

**用途**:
- マスターキーファイルのファイル名として使用
- `SessionKey.create()`の`address`パラメータとして使用
- ユーザーを一意に識別するためのIDとして使用

## キーの種類と形式

### 1. マスターキー（Master Key）

**役割**: 
- `SessionKey`の内部Ed25519Keypairの秘密鍵
- 署名用の鍵ペア（復号には直接使用されない）
- Seal key serverからAES-256-GCM鍵（32バイト）を取得する際の認証に使用

**形式**:
- **bech32エンコードされた文字列**（`suiprivkey1...`形式）
- 長さ: 70文字
- 例: `suiprivkey1qrcalg9pj5yxmwdne4aq9j2nc7vkj9meeltwjfxpslh9cflglwlx7733x6h`

**ファイル保存形式**:
- **ファイル名**: `{userAddress}.key`
  - 例: `0x95dfd19d5ba1d4f7e247f89c66632d0692143c1fa70a342b69311e675162840d.key`
- **保存先**: `app/data/master-keys/`
- **ファイル内容**: bech32エンコードされた秘密鍵（文字列、UTF-8エンコード）
- **保存方法**: 
  ```typescript
  writeFileSync(masterKeyFile, masterKey, "utf8");
  ```

**読み込み方法**:
```typescript
const masterKey = readFileSync(masterKeyFile, "utf8").trim();
```

### 2. パブリックキー（Public Key）

**役割**:
- `SessionKey`の内部Ed25519Keypairの公開鍵
- 検証用（現在の実装では保存不要）

**形式**:
- **Suiアドレス**（`0x...`形式）
- 長さ: 66文字（`0x` + 64文字のhex）
- 例: `0x95dfd19d5ba1d4f7e247f89c66632d0692143c1fa70a342b69311e675162840d`

**ファイル保存形式**（オプション）:
- **ファイル名**: `{userAddress}.pub`
  - 例: `0x95dfd19d5ba1d4f7e247f89c66632d0692143c1fa70a342b69311e675162840d.pub`
- **保存先**: `app/data/master-keys/`
- **ファイル内容**: Suiアドレス（文字列、UTF-8エンコード）
- **保存方法**: 
  ```typescript
  const publicKey = userKeypair.getPublicKey().toSuiAddress();
  writeFileSync(publicKeyFile, publicKey, "utf8");
  ```

**読み込み方法**:
```typescript
const publicKey = readFileSync(publicKeyFile, "utf8").trim();
```

## 現在の実装

### マスターキーの保存（`seal.ts`）

```typescript
// SessionKeyを作成した後、マスターキーを保存
const exported = sessionKey.export();
const masterKey = exported.sessionKey; // bech32エンコードされた秘密鍵

const masterKeyFile = join(MASTER_KEYS_DIR, `${userAddress}.key`);
writeFileSync(masterKeyFile, masterKey, "utf8");
```

### マスターキーの読み込み（`server.ts`）

```typescript
const masterKeyFile = join(__dirname, "../../data/master-keys", `${session.userAddress}.key`);
let masterKey: string | undefined;
if (existsSync(masterKeyFile)) {
    masterKey = readFileSync(masterKeyFile, "utf8").trim();
}
```

## 重要なポイント

1. **マスターキーはbech32エンコードされた文字列として保存**
   - BufferやUint8Arrayとして保存すると、`Ed25519Keypair.fromSecretKey()`でエラーが発生します
   - エラー: `Wrong secretKey size. Expected 32 bytes, got 70.`

2. **マスターキーは署名用**
   - 実際の復号に使用するAES-256-GCM鍵（32バイト）は、Seal key serverから取得されます
   - `SealClient.decrypt()`は`SessionKey`を使用して自動的にkey serverから鍵を取得します

3. **ファイル名はユーザーアドレスベース**
   - 1ユーザー = 1マスターキーファイル
   - ファイル名: `{userAddress}.key`

4. **パブリックキーは現在保存不要**
   - マスターキーから公開鍵を導出可能
   - 必要に応じて保存可能（検証用）

## トラブルシューティング

### エラー: `Wrong secretKey size. Expected 32 bytes, got 70.`

**原因**: 
- マスターキーがBufferやUint8Arrayとして解釈されている
- `SessionKey.import()`内で`Ed25519Keypair.fromSecretKey(data.sessionKey)`が呼ばれる際に、`data.sessionKey`が文字列として正しく渡されていない

**解決方法**:
1. マスターキーファイルが存在することを確認
2. マスターキーがbech32エンコードされた文字列（70文字）であることを確認
3. `SessionKey.import()`に渡す前に、`sessionKey`フィールドが文字列であることを確認

### マスターキーファイルが見つからない

**原因**: 
- `createSessionKey()`が呼ばれた際に、マスターキーファイルが保存されていない
- ファイルパスが間違っている

**解決方法**:
1. `createSessionKey()`が呼ばれた際に、マスターキーファイルが保存されることを確認
2. `MASTER_KEYS_DIR`が正しく設定されていることを確認
3. ディレクトリが存在することを確認（`mkdirSync(MASTER_KEYS_DIR, { recursive: true })`）

## 参考

- [Seal SDK GitHub](https://github.com/MystenLabs/seal)
- [Seal CLI Documentation](https://seal-docs.wal.app/SealCLI/#4-extract-user-secret-keys-for-threshold-decrypt)
- [Sui Ed25519Keypair Documentation](https://sdk.mystenlabs.com/typescript/keypairs/ed25519)

