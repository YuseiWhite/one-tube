import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import dotenv from 'dotenv';
import type { PurchaseRequest, PurchaseResponse } from '../shared/types.js';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://fullnode.devnet.sui.io:443';
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const PACKAGE_ID = process.env.PACKAGE_ID;
const KIOSK_ID = process.env.KIOSK_ID;
const TRANSFER_POLICY_ID = process.env.TRANSFER_POLICY_ID;
const KIOSK_INITIAL_SHARED_VERSION = process.env.KIOSK_INITIAL_SHARED_VERSION;
const TRANSFER_POLICY_INITIAL_SHARED_VERSION = process.env.TRANSFER_POLICY_INITIAL_SHARED_VERSION;

if (!SPONSOR_PRIVATE_KEY || !PACKAGE_ID || !KIOSK_ID || !TRANSFER_POLICY_ID) {
  throw new Error('Missing required environment variables for sponsor.ts');
}

if (!KIOSK_INITIAL_SHARED_VERSION || !TRANSFER_POLICY_INITIAL_SHARED_VERSION) {
  throw new Error('Missing shared object version environment variables');
}

// ヘルパー関数: SPONSOR_PRIVATE_KEYを Uint8Array に変換
function toSecretKeyBytes(raw: string): Uint8Array {
  if (raw.startsWith('suiprivkey')) {
    const { secretKey } = decodeSuiPrivateKey(raw);
    return secretKey;
  }
  // hex形式想定（0x接頭辞の有無に対応）
  const hex = raw.startsWith('0x') ? raw.slice(2) : raw;
  return fromHEX(hex);
}

const client = new SuiClient({ url: RPC_URL });

const sponsorKeypair = Ed25519Keypair.fromSecretKey(
  toSecretKeyBytes(SPONSOR_PRIVATE_KEY)
);

console.log('✅ Sponsor service initialized');
console.log(`📍 Network: ${RPC_URL}`);
console.log(`📍 Sponsor address: ${sponsorKeypair.getPublicKey().toSuiAddress()}`);

function buildPurchaseTransaction(request: PurchaseRequest): Transaction {
  const tx = new Transaction();

  // 1. Kiosk購入
  const [nft, transferRequest] = tx.moveCall({
    target: '0x2::kiosk::purchase',
    arguments: [
      tx.sharedObjectRef({
        objectId: KIOSK_ID!,
        initialSharedVersion: KIOSK_INITIAL_SHARED_VERSION!,
        mutable: true
      }),
      tx.pure.id(request.nftId),
      tx.splitCoins(tx.gas, [500_000_000])
    ],
    typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
  });

  // 2. 収益分配
  tx.moveCall({
    target: `${PACKAGE_ID}::contracts::split_revenue`,
    arguments: [
      tx.sharedObjectRef({
        objectId: TRANSFER_POLICY_ID!,
        initialSharedVersion: TRANSFER_POLICY_INITIAL_SHARED_VERSION!,
        mutable: true
      }),
      transferRequest,
      tx.splitCoins(tx.gas, [500_000_000])
    ]
  });

  // 3. Transfer Request確認
  tx.moveCall({
    target: '0x2::transfer_policy::confirm_request',
    arguments: [
      tx.sharedObjectRef({
        objectId: TRANSFER_POLICY_ID!,
        initialSharedVersion: TRANSFER_POLICY_INITIAL_SHARED_VERSION!,
        mutable: true
      }),
      transferRequest
    ],
    typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
  });

  // 4. NFT転送
  tx.transferObjects([nft], tx.pure.address(request.userAddress));

  return tx;
}

export async function sponsorPurchase(
  request: PurchaseRequest
): Promise<PurchaseResponse> {
  try {
    console.log('🔄 Sponsored Purchase started:', request);

    const tx = buildPurchaseTransaction(request);

    const result = await client.signAndExecuteTransaction({
      signer: sponsorKeypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });

    console.log('✅ Transaction executed:', result.digest);

    const nftId = extractNFTId(result.objectChanges, request.userAddress);

    if (!nftId) {
      throw new Error('NFT ID not found in transaction result');
    }

    return {
      success: true,
      txDigest: result.digest,
      nftId
    };

  } catch (error) {
    console.error('❌ Sponsored purchase failed:', error);
    const friendlyMessage = isListingMissingError(error)
      ? 'Listing not found (already sold or incorrect nftId)'
      : error instanceof Error
        ? error.message
        : 'Unknown error';
    return {
      success: false,
      error: friendlyMessage
    };
  }
}

function extractNFTId(
  objectChanges: any[] | undefined | null,
  recipient: string
): string | null {
  if (!objectChanges) return null;

  const normalizedRecipient = recipient.toLowerCase();
  const nftChange = objectChanges.find((change: any) => {
    if (
      !change?.objectType ||
      !change.objectType.includes('::contracts::PremiumTicketNFT')
    ) {
      return false;
    }

    if (!['created', 'mutated', 'transferred'].includes(change.type)) {
      return false;
    }

    const owner =
      typeof change.owner === 'object' ? change.owner?.AddressOwner : undefined;
    return owner?.toLowerCase() === normalizedRecipient;
  });

  return nftChange?.objectId || null;
}

// Note: このMVPではDynamic Fieldを扱うのはkiosk::purchaseだけなので、
// dynamic_field::remove_child_objectのアボートを「listing missing」として扱っている。
// もし将来ほかのDynamic Field処理を追加する場合は、この判定を見直すこと。
function isListingMissingError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (
    typeof message === 'string' &&
    message.includes('dynamic_field') &&
    message.includes('remove_child_object')
  ) {
    return true;
  }

  const abortError = (error as any)?.cause?.effects?.abortError;
  if (!abortError) {
    return false;
  }

  const moduleName =
    abortError.module?.name ||
    abortError.module_name ||
    abortError.moduleName ||
    '';
  const functionName =
    abortError.function_name ||
    abortError.functionName ||
    abortError.function?.name ||
    '';
  const subStatus =
    abortError.sub_status ?? abortError.subStatus ?? abortError.code ?? null;

  if (
    moduleName === 'dynamic_field' &&
    functionName === 'remove_child_object' &&
    Number(subStatus) === 1
  ) {
    return true;
  }

  try {
    const serialized = JSON.stringify(abortError);
    return (
      serialized.includes('dynamic_field') &&
      serialized.includes('remove_child_object') &&
      serialized.includes('"1"')
    );
  } catch {
    return false;
  }
}

export async function getSponsorBalance(): Promise<string> {
  const address = sponsorKeypair.getPublicKey().toSuiAddress();
  const balance = await client.getBalance({ owner: address });
  return balance.totalBalance;
}
