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