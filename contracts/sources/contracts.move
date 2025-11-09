module contracts::contracts;

use std::string::String;
use sui::transfer_policy::{TransferPolicy, TransferPolicyCap, TransferRequest};
use sui::package::Publisher;
use sui::coin::Coin;
use sui::sui::SUI;

// ====== エラーコード ======

const EInvalidCount: u64 = 0;
const EInvalidBasisPoints: u64 = 1;

// ====== 構造体 ======

/// ONE_TIME_WITNESS - Publisherの取得に使用
public struct CONTRACTS has drop {}

/// 管理者権限 - 保有者のみNFTをミント可能
public struct AdminCap has key, store {
    id: sui::object::UID,
}

/// プレミアムチケットNFT - 動画コンテンツへのアクセスを提供
public struct PremiumTicketNFT has key, store {
    id: sui::object::UID,
    name: String,
    description: String,
    blob_id: String,  // Walrus BLOB ID（MVP用モック）
}

/// 収益分配ルール用Witness
public struct RevenueShareRule has drop {}

/// 収益分配設定
public struct RevenueShareConfig has store, drop {
    athlete_address: address,
    one_address: address,
    platform_address: address,
    athlete_bp: u16,  // basis points (7000 = 70%)
    one_bp: u16,      // basis points (2500 = 25%)
    platform_bp: u16, // basis points (500 = 5%)
}

// ====== 初期化関数 ======

/// モジュール初期化 - Publisherの作成とAdminCapの発行
fun init(otw: CONTRACTS, ctx: &mut sui::tx_context::TxContext) {
    // Publisherを作成（ONE_TIME_WITNESSを使用）
    let publisher = sui::package::claim(otw, ctx);

    // AdminCapを作成
    let admin_cap = AdminCap {
        id: sui::object::new(ctx),
    };

    // Publisherとadmin_capをデプロイヤーに転送
    sui::transfer::public_transfer(publisher, sui::tx_context::sender(ctx));
    sui::transfer::transfer(admin_cap, sui::tx_context::sender(ctx));
}

// ====== Phase 1: NFTミント ======

/// NFTのバッチミント（運営側が在庫作成）
/// Kioskに預けるNFTのベクターを返す
public fun mint_batch(
    _admin_cap: &AdminCap,  // 管理者権限が必要
    count: u64,
    name: String,
    description: String,
    blob_id: String,
    ctx: &mut sui::tx_context::TxContext
): vector<PremiumTicketNFT> {
    assert!(count > 0, EInvalidCount);

    let mut nfts = vector::empty<PremiumTicketNFT>();
    let mut i = 0;

    while (i < count) {
        let nft = PremiumTicketNFT {
            id: sui::object::new(ctx),
            name,
            description,
            blob_id,
        };
        vector::push_back(&mut nfts, nft);
        i = i + 1;
    };

    nfts
}

// ====== アクセサー関数 ======

/// NFT名を取得
public fun name(nft: &PremiumTicketNFT): String {
    nft.name
}

/// NFTの説明を取得
public fun description(nft: &PremiumTicketNFT): String {
    nft.description
}

/// NFTのblob_idを取得
public fun blob_id(nft: &PremiumTicketNFT): String {
    nft.blob_id
}

// ====== Phase 2: Transfer Policy関数 ======

/// Transfer Policyを作成（収益分配ルール付き）
/// Publisher権限が必要（デプロイ時にinit関数で取得）
public fun create_transfer_policy(
    publisher: &Publisher,
    ctx: &mut sui::tx_context::TxContext
): (TransferPolicy<PremiumTicketNFT>, TransferPolicyCap<PremiumTicketNFT>) {
    // Transfer Policyを作成
    let (policy, cap) = sui::transfer_policy::new<PremiumTicketNFT>(publisher, ctx);

    (policy, cap)
}

/// 収益分配ルールの設定をTransfer Policyに追加
/// デプロイ後、管理者がこの関数を呼び出して収益分配先を設定
public fun add_revenue_share_rule(
    policy: &mut TransferPolicy<PremiumTicketNFT>,
    cap: &TransferPolicyCap<PremiumTicketNFT>,
    athlete_address: address,
    one_address: address,
    platform_address: address,
) {
    // 収益分配設定を作成
    let config = RevenueShareConfig {
        athlete_address,
        one_address,
        platform_address,
        athlete_bp: 7000,  // 70%
        one_bp: 2500,      // 25%
        platform_bp: 500,  // 5%
    };

    // 合計が100%であることを検証
    assert!(config.athlete_bp + config.one_bp + config.platform_bp == 10000, EInvalidBasisPoints);

    // ルールをポリシーに追加
    sui::transfer_policy::add_rule(RevenueShareRule {}, policy, cap, config);
}

/// 収益分配の実行（Kiosk購入時に呼び出される）
/// Transfer Requestを検証し、支払いを分配する
public fun split_revenue(
    policy: &TransferPolicy<PremiumTicketNFT>,
    request: &mut TransferRequest<PremiumTicketNFT>,
    mut payment: Coin<SUI>,
    ctx: &mut sui::tx_context::TxContext
) {
    // ポリシーから収益分配設定を取得
    let config = sui::transfer_policy::get_rule<PremiumTicketNFT, RevenueShareRule, RevenueShareConfig>(
        RevenueShareRule {},
        policy
    );

    let total_amount = sui::coin::value(&payment);

    // 各受取人への分配額を計算（basis points使用、丸め誤差対策）
    let athlete_amount = ((total_amount as u128) * (config.athlete_bp as u128) / 10000) as u64;
    let one_amount = ((total_amount as u128) * (config.one_bp as u128) / 10000) as u64;
    // Platform は残り全額を受け取る（丸め誤差を吸収）

    // アスリートへの支払い (70%)
    let athlete_coin = sui::coin::split(&mut payment, athlete_amount, ctx);
    sui::transfer::public_transfer(athlete_coin, config.athlete_address);

    // ONE Championshipへの支払い (25%)
    let one_coin = sui::coin::split(&mut payment, one_amount, ctx);
    sui::transfer::public_transfer(one_coin, config.one_address);

    // プラットフォームへの支払い (5% + 丸め誤差)
    sui::transfer::public_transfer(payment, config.platform_address);

    // Transfer Requestにレシートを追加（ルール適用完了）
    sui::transfer_policy::add_receipt(RevenueShareRule {}, request);
}

/// 収益分配設定の取得（読み取り専用）
public fun get_revenue_share_config(
    policy: &TransferPolicy<PremiumTicketNFT>
): &RevenueShareConfig {
    sui::transfer_policy::get_rule<PremiumTicketNFT, RevenueShareRule, RevenueShareConfig>(
        RevenueShareRule {},
        policy
    )
}

/// アスリート分配比率を取得
public fun athlete_bp(config: &RevenueShareConfig): u16 {
    config.athlete_bp
}

/// ONE Championship分配比率を取得
public fun one_bp(config: &RevenueShareConfig): u16 {
    config.one_bp
}

/// Platform分配比率を取得
public fun platform_bp(config: &RevenueShareConfig): u16 {
    config.platform_bp
}

// ====== テスト専用関数 ======

#[test_only]
/// テスト用の初期化 - AdminCapとPublisherを作成
public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
    // ONE_TIME_WITNESSを生成してinit関数を呼び出す
    let otw = CONTRACTS {};
    init(otw, ctx);
}

#[test_only]
/// テスト用のPublisher作成
public fun create_publisher_for_testing(ctx: &mut sui::tx_context::TxContext): Publisher {
    sui::package::test_claim(CONTRACTS {}, ctx)
}
