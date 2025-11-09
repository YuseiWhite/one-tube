module contracts::contracts;

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