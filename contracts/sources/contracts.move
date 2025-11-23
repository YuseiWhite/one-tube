module contracts::contracts;

use std::string::String;
use sui::transfer_policy::{TransferPolicy, TransferPolicyCap, TransferRequest};
use sui::package::Publisher;
use sui::coin::Coin;
use sui::sui::SUI;
#[test_only] use sui::test_scenario;

// ====== エラーコード ======

const EInvalidCount: u64 = 0;
const EInvalidBasisPoints: u64 = 1;
#[allow(unused_const)]  // テスト専用関数で使用されるため警告を抑制
const E_NOT_NFT_OWNER: u64 = 2;

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
    blob_id: String,  // Walrus BLOB ID
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

/// ミント＆転送: NFTをバッチでミントして呼び出し元に転送
public fun mint_and_transfer_batch(
    admin_cap: &AdminCap,
    count: u64,
    name: String,
    description: String,
    blob_id: String,
    recipient: address,
    ctx: &mut sui::tx_context::TxContext
) {
    let mut nfts = mint_batch(admin_cap, count, name, description, blob_id, ctx);
    let mut i = 0;
    let len = vector::length(&nfts);

    while (i < len) {
        let nft = vector::pop_back(&mut nfts);
        sui::transfer::public_transfer(nft, recipient);
        i = i + 1;
    };

    vector::destroy_empty(nfts);
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

// ====== Phase 1: Seal統合関数 ======

/// Sealアクセス制御関数: PremiumTicketNFT所有を確認（内部実装）
/// id: Seal identity ID（package IDのprefixなし）
/// ticket: 所有確認するPremiumTicketNFTオブジェクト
/// sender: トランザクションのsender
///
/// セキュリティ: user引数は使用せず、tx_context::sender()でトランザクションのsenderを取得する
/// ポリシーの制約: この関数は読み取り専用で実装する（storageを書き換えない）
///
/// 注意: 実際の所有確認は、Seal key serverが`dry_run_transaction_block`で評価する際に
/// 自動的に実行される。この関数は、テストシナリオで所有確認ができるように簡易的な実装を行う。
///
/// テストシナリオでの所有確認:
/// - テストシナリオでは、`test_scenario::has_most_recent_for_sender`を使用して所有確認を行う
/// - 実際の実装では、Seal key serverが`dry_run_transaction_block`で評価する際に、
///   トランザクションのsenderがNFTを所有しているかが自動的に確認される
public fun seal_approve_nft_internal(
    _id: vector<u8>,
    ticket: &PremiumTicketNFT,
    sender: address
) {
    // NFT所有確認ロジック
    // 注意: Suiオブジェクトには`owner`フィールドが存在しない
    // 実際の実装では、Seal key serverが`dry_run_transaction_block`で評価する際に、
    // トランザクションのsenderがNFTを所有しているかが自動的に確認される

    // テストシナリオでの所有確認（簡易的な実装）
    // テストシナリオでは、`test_scenario::has_most_recent_for_sender`を使用して所有確認を行う
    // 実際の実装では、Seal key serverが`dry_run_transaction_block`で評価する際に行われる

    // 注意: この関数は読み取り専用で実装する（storageを書き換えない）
    // 実際の所有確認は、Seal key serverが`dry_run_transaction_block`で評価する際に行われる

    // ticketを参照することで、NFTが存在することを確認
    let _ticket_id = sui::object::id(ticket);
    let _sender = sender;

    // テストシナリオでの所有確認は、テストコード側で`test_scenario::has_most_recent_for_sender`を使用して行う
    // 実際の実装では、Seal key serverが`dry_run_transaction_block`で評価する際に行われる
}

/// テスト専用: NFT所有確認（テストシナリオ用）
/// テストシナリオで、senderがNFTを所有しているかどうかを確認する
#[test_only]
public fun seal_approve_nft_internal_with_ownership_check(
    id: vector<u8>,
    ticket: &PremiumTicketNFT,
    sender: address,
    scenario: &mut test_scenario::Scenario
) {
    // テストシナリオでの所有確認
    // senderがPremiumTicketNFT型のオブジェクトを所有しているかどうかを確認
    // 注意: 特定のオブジェクトIDを指定することはできないため、
    // senderがPremiumTicketNFT型のオブジェクトを所有しているかどうかのみを確認する
    if (!test_scenario::has_most_recent_for_sender<PremiumTicketNFT>(scenario)) {
        abort E_NOT_NFT_OWNER
    };

    // 所有確認が成功した場合、通常の処理を実行
    seal_approve_nft_internal(id, ticket, sender);
}

/// Sealアクセス制御関数: PremiumTicketNFT所有を確認（エントリーポイント）
/// id: Seal identity ID（package IDのprefixなし）
/// ticket: 所有確認するPremiumTicketNFTオブジェクト
/// ctx: トランザクションコンテキスト（senderを取得するため）
///
/// セキュリティ: user引数は使用せず、tx_context::sender()でトランザクションのsenderを取得する
/// ポリシーの制約: この関数は読み取り専用で実装する（storageを書き換えない）
entry fun seal_approve_nft(
    id: vector<u8>,
    ticket: &PremiumTicketNFT,
    ctx: &sui::tx_context::TxContext
) {
    let sender = sui::tx_context::sender(ctx);
    seal_approve_nft_internal(id, ticket, sender);
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
