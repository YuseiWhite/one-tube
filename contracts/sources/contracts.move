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
