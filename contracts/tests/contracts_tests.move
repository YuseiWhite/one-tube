#[test_only]
module contracts::contracts_tests;

use contracts::contracts::{Self, PremiumTicketNFT, AdminCap, E_NOT_NFT_OWNER};
use sui::test_scenario::{Self as ts};
use std::string;
use std::debug;
use std::bcs;

const EMOJI_LOGS_ENABLED: bool = false;

fun log(bytes: vector<u8>) {
    let msg = string::utf8(bytes);
    debug::print(&msg);
}

fun log_blank_line() {
    let mut newline = vector::empty<u8>();
    vector::push_back(&mut newline, 10); // '\n'
    log(newline);
}

fun log_scenario(detail: vector<u8>) {
    log_blank_line();
    log(filter_emoji(b"----------------------------------------"));
    log(filter_emoji(detail));
}

fun build_step_bytes(tag: vector<u8>, step: u64): vector<u8> {
    let mut bytes = filter_emoji(tag);
    vector::push_back(&mut bytes, 32); // space
    push_literal(&mut bytes, b"STEP ");
    vector::append(&mut bytes, string::into_bytes(u64_to_string(step)));
    vector::push_back(&mut bytes, 58); // ':'
    vector::push_back(&mut bytes, 32); // space
    bytes
}

fun log_step_bytes(tag: vector<u8>, step: u64, detail: vector<u8>) {
    let mut message = build_step_bytes(tag, step);
    vector::append(&mut message, filter_emoji(detail));
    log(message);
}

fun log_u64(tag: vector<u8>, step: u64, label: vector<u8>, value: u64) {
    let mut detail = filter_emoji(label);
    vector::push_back(&mut detail, 58);
    vector::push_back(&mut detail, 32);
    vector::append(&mut detail, string::into_bytes(u64_to_string(value)));
    log_step_bytes(tag, step, detail);
}

fun log_object_id(tag: vector<u8>, step: u64, label: vector<u8>, id: &object::ID) {
    let mut detail = filter_emoji(label);
    vector::push_back(&mut detail, 58);
    vector::push_back(&mut detail, 32);
    vector::append(&mut detail, short_object_id(id));
    log_step_bytes(tag, step, detail);
}

fun log_tx_digest(tag: vector<u8>, step: u64, label: vector<u8>, digest: &vector<u8>) {
    let mut detail = filter_emoji(label);
    vector::push_back(&mut detail, 58);
    vector::push_back(&mut detail, 32);
    vector::append(&mut detail, short_digest(digest));
    log_step_bytes(tag, step, detail);
}

fun log_current_tx_digest(tag: vector<u8>, step: u64, label: vector<u8>, scenario: &mut ts::Scenario) {
    let digest = tx_context::digest(ts::ctx(scenario));
    log_tx_digest(tag, step, label, digest);
}

fun log_current_tx_digest_for_sender(
    tag: vector<u8>,
    step: u64,
    scenario: &mut ts::Scenario,
    sender: address,
    prefix: vector<u8>,
) {
    let mut label = filter_emoji(prefix);
    push_literal(&mut label, b" sender=");
    vector::append(&mut label, short_address(sender));
    log_current_tx_digest(tag, step, label, scenario);
}

fun short_object_id(id: &object::ID): vector<u8> {
    let bytes = bcs::to_bytes(id);
    short_hex_bytes(&bytes)
}

fun short_digest(digest: &vector<u8>): vector<u8> {
    short_hex_bytes(digest)
}

fun short_address(addr: address): vector<u8> {
    let bytes = bcs::to_bytes(&addr);
    short_hex_bytes(&bytes)
}

fun short_hex_bytes(bytes: &vector<u8>): vector<u8> {
    let total = vector::length(bytes);
    let mut out = vector::empty<u8>();
    vector::push_back(&mut out, 48); // '0'
    vector::push_back(&mut out, 120); // 'x'

    let prefix_bytes = if (total < 2) { total } else { 2 };
    let mut i = 0;
    while (i < prefix_bytes) {
        append_hex_byte(*vector::borrow(bytes, i), &mut out);
        i = i + 1;
    };

    if (total > prefix_bytes) {
        push_literal(&mut out, b"...");
        let suffix_bytes = if (total < 2) { total } else { 2 };
        let mut j = total - suffix_bytes;
        while (j < total) {
            append_hex_byte(*vector::borrow(bytes, j), &mut out);
            j = j + 1;
        };
    };

    out
}

fun append_hex_byte(byte: u8, out: &mut vector<u8>) {
    vector::push_back(out, nibble_to_hex(byte / 16));
    vector::push_back(out, nibble_to_hex(byte % 16));
}

fun nibble_to_hex(nibble: u8): u8 {
    if (nibble < 10) {
        return 48 + nibble
    };
    97 + (nibble - 10)
}

fun push_literal(out: &mut vector<u8>, literal: vector<u8>) {
    vector::append(out, literal);
}

fun filter_emoji(bytes: vector<u8>): vector<u8> {
    if (EMOJI_LOGS_ENABLED) {
        return bytes
    };
    let mut filtered = vector::empty<u8>();
    let mut i = 0;
    while (i < vector::length(&bytes)) {
        let byte = *vector::borrow(&bytes, i);
        if (byte < 128) {
            vector::push_back(&mut filtered, byte);
        };
        i = i + 1;
    };
    filtered
}

fun u64_to_string(value: u64): string::String {
    if (value == 0) {
        return string::utf8(b"0")
    };

    let mut digits = vector::empty<u8>();
    let mut remaining = value;

    while (remaining > 0) {
        let digit = (remaining % 10) as u8 + 48;
        vector::push_back(&mut digits, digit);
        remaining = remaining / 10;
    };

    let mut bytes = vector::empty<u8>();
    while (!vector::is_empty(&digits)) {
        let digit = vector::pop_back(&mut digits);
        vector::push_back(&mut bytes, digit);
    };

    string::utf8(bytes)
}

// テスト: NFT mint_batch関数
#[test]
fun test_mint_batch() {
    let admin = @0xA;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_mint_batch]";
    let mut step = 1;
    log_scenario(b"Scenario 3: admin prepares kiosk inventory");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化（adminがAdminCapを受け取る）
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Issued AdminCap via init_for_testing");
        step = step + 1;
    };

    // 10個のNFTを発行
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            10,
            string::utf8(b"ONE 170 Premium Ticket"),
            string::utf8(b"Access to full match videos"),
            string::utf8(b"mock-blob-id-123"),
            ts::ctx(&mut scenario)
        );

        // 個数を検証
        assert!(vector::length(&nfts) == 10, 0);
        log_step_bytes(tag, step, b"Minted 10 PremiumTicketNFT objects");
        step = step + 1;

        // NFTをadminに転送
        while (!vector::is_empty(&nfts)) {
            let nft = vector::pop_back(&mut nfts);
            sui::transfer::public_transfer(nft, admin);
        };
        vector::destroy_empty(nfts);

        ts::return_to_sender(&scenario, admin_cap);
    };

    // NFTが受領されたことを検証
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);
        assert!(contracts::name(&nft) == string::utf8(b"ONE 170 Premium Ticket"), 1);
        assert!(contracts::description(&nft) == string::utf8(b"Access to full match videos"), 2);
        assert!(contracts::blob_id(&nft) == string::utf8(b"mock-blob-id-123"), 3);
        let mut detail = b"name=";
        vector::append(&mut detail, string::into_bytes(contracts::name(&nft)));
        push_literal(&mut detail, b", desc=");
        vector::append(&mut detail, string::into_bytes(contracts::description(&nft)));
        push_literal(&mut detail, b", blob=");
        vector::append(&mut detail, string::into_bytes(contracts::blob_id(&nft)));
        log_step_bytes(tag, step, detail);
        ts::return_to_sender(&scenario, nft);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (before end)");
    ts::end(scenario);
}

// テスト: 管理者のみがミント可能（権限テスト）
#[test]
#[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
fun test_mint_requires_admin_cap() {
    let admin = @0xA;
    let unauthorized = @0xB;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_mint_requires_admin_cap]";
    let mut step = 1;
    log_scenario(b"Scenario 4: expect EEmptyInventory abort when unauthorized mints");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"AdminCap issued to deployer");
        step = step + 1;
    };

	log_step_bytes(
		tag,
		step,
		b"Rule: AdminCap holder only; aborts with sui::test_scenario::EEmptyInventory (code=0x1) if violated",
	);
    step = step + 1;

    // AdminCapなしでミントを試行（失敗が期待される）
    ts::next_tx(&mut scenario, unauthorized);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, unauthorized, b"Tx digest (next_tx)");
    step = step + 1;
    {
        log_step_bytes(
            tag,
            step,
            b"Unauthorized address attempts to pull AdminCap (should abort with EEmptyInventory)",
        );
        step = step + 1;
        // 期待される失敗箇所: 権限のないユーザーがAdminCapの取得を試みる
        // EEmptyInventoryエラーでabortする（ユーザーがAdminCapを所有していないため）
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        log_step_bytes(tag, step, b"Unexpected: unauthorized user obtained AdminCap");

        // ここには到達しない - AdminCapなしではmint_batchを呼び出せない
        let nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Unauthorized"),
            string::utf8(b"This should fail"),
            string::utf8(b"fail"),
            ts::ctx(&mut scenario)
        );

        vector::destroy_empty(nfts);
        ts::return_to_sender(&scenario, admin_cap);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, unauthorized, b"Tx digest (before end)");
    ts::end(scenario);
}

// ====== Phase 2 & 3: 所有権・アクセス制御テスト ======

// テスト: NFT所有権の確認（SDKチェックをシミュレート）
#[test]
fun test_nft_ownership_verification() {
    let admin = @0xA;
    let user = @0xB;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_nft_ownership_verification]";
    let mut step = 1;
    log_scenario(b"Scenario 5: verify owner receives NFT");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    // AdminがNFTを発行してユーザーに転送
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Ownership Test NFT"),
            string::utf8(b"Test ownership"),
            string::utf8(b"blob-ownership"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        // NFTをユーザーに転送
        sui::transfer::public_transfer(nft, user);

        ts::return_to_sender(&scenario, admin_cap);
        log_step_bytes(tag, step, b"Admin minted NFT and transferred to user");
        step = step + 1;
    };

    // ユーザーがNFTを受け取る（所有権確認）
    ts::next_tx(&mut scenario, user);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, user, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // ユーザーがNFTを取得できれば、所有していることを意味する
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);

        // NFTプロパティを検証
        assert!(contracts::name(&nft) == string::utf8(b"Ownership Test NFT"), 0);
        assert!(contracts::blob_id(&nft) == string::utf8(b"blob-ownership"), 1);
        let mut detail = b"name=";
        vector::append(&mut detail, string::into_bytes(contracts::name(&nft)));
        push_literal(&mut detail, b", blob=");
        vector::append(&mut detail, string::into_bytes(contracts::blob_id(&nft)));
        log_step_bytes(tag, step, detail);

        // NFTをユーザーに返却
        ts::return_to_sender(&scenario, nft);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, user, b"Tx digest (before end)");
    ts::end(scenario);
}

// テスト: 非所有者はNFTにアクセスできない
#[test]
#[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
fun test_non_owner_cannot_access_nft() {
    let admin = @0xA;
    let owner = @0xB;
    let non_owner = @0xC;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_non_owner_cannot_access_nft]";
    let mut step = 1;
    log_scenario(b"Scenario 6: non-owner access should abort");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    // AdminがNFTを発行して所有者に転送
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Restricted NFT"),
            string::utf8(b"Only owner can access"),
            string::utf8(b"blob-restricted"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        sui::transfer::public_transfer(nft, owner);

        ts::return_to_sender(&scenario, admin_cap);
        log_step_bytes(tag, step, b"Owner received the restricted NFT");
        step = step + 1;
    };

        log_step_bytes(
            tag,
            step,
            b"Rule: owner inventory required; aborts with sui::test_scenario::EEmptyInventory (code=0x1) if violated",
        );
    step = step + 1;

    // 非所有者がNFTを取得しようとする（失敗が期待される）
    ts::next_tx(&mut scenario, non_owner);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, non_owner, b"Tx digest (next_tx)");
    step = step + 1;
    {
        log_step_bytes(
            tag,
            step,
            b"Non-owner attempts to take NFT (should abort with EEmptyInventory)",
        );
        step = step + 1;
        // 期待される失敗箇所: 非所有者が所有していないNFTの取得を試みる
        // EEmptyInventoryエラーでabortする（non_ownerはNFTを所有していないため）
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);

        // ここには到達しない
        ts::return_to_sender(&scenario, nft);
        log_step_bytes(tag, step, b"Unexpected: non-owner accessed NFT");
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, non_owner, b"Tx digest (before end)");
    ts::end(scenario);
}

// ====== Phase 2: Kiosk統合テスト ======

// テスト5: Kioskへの出品と取り下げ
#[test]
fun test_kiosk_list_and_delist() {
    use sui::kiosk;

    let admin = @0xA;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_kiosk_list_and_delist]";
    let mut step = 1;
    log_scenario(b"Scenario 1: list and delist NFT on kiosk");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    // AdminがKioskを作成してNFTを発行
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // Kioskを作成
        let (mut kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));
        let kiosk_id = object::id(&kiosk);
        log_object_id(tag, step, b"Kiosk object id", &kiosk_id);
        step = step + 1;
        let kiosk_cap_id = object::id(&kiosk_cap);
        log_object_id(tag, step, b"KioskOwnerCap object id", &kiosk_cap_id);
        step = step + 1;

        // NFTを発行
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Kiosk Test NFT"),
            string::utf8(b"For Kiosk listing"),
            string::utf8(b"blob-kiosk-list"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        // NFTのIDを取得（placeする前に）
        let nft_id = sui::object::id(&nft);
        log_object_id(tag, step, b"NFT object id", &nft_id);
        step = step + 1;

        // NFTをKioskに配置
        kiosk::place(&mut kiosk, &kiosk_cap, nft);

        // 配置されたことを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 0);
        log_step_bytes(tag, step, b"Placed NFT into kiosk inventory");
        step = step + 1;

        // NFTを出品（0.025 SUI = 25,000,000 MIST）
        kiosk::list<PremiumTicketNFT>(&mut kiosk, &kiosk_cap, nft_id, 25_000_000);
        log_step_bytes(tag, step, b"Listed NFT at 0.025 SUI (25_000_000 MIST)");
        step = step + 1;

        // 出品後も存在することを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 1);

        // 出品を取り下げ
        kiosk::delist<PremiumTicketNFT>(&mut kiosk, &kiosk_cap, nft_id);

        // 取り下げ後もKiosk内に存在することを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 2);
        log_step_bytes(tag, step, b"Delisted NFT and confirmed it remains inside kiosk");

        ts::return_to_sender(&scenario, admin_cap);
        sui::transfer::public_share_object(kiosk);
        sui::transfer::public_transfer(kiosk_cap, admin);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (before end)");
    ts::end(scenario);
}

// テスト6: Kiosk購入フローと収益分配（Transfer Policy統合版）
#[test]
fun test_kiosk_purchase_flow_split_revenue() {
    use sui::kiosk::{Self, Kiosk};
    use sui::coin;
    use sui::sui::SUI;
    use sui::transfer_policy::TransferPolicy;

    let admin = @0xA;
    let buyer = @0xB;
    let athlete = @0xC;
    let one_championship = @0xD;
    let platform = @0xE;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_kiosk_purchase_flow_split_revenue]";
    let mut step = 1;
    log_scenario(b"Scenario 2: purchase flow with revenue split");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化（PublisherとAdminCapを取得）
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    let nft_id: sui::object::ID;

    // Transfer Policyをセットアップ
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let publisher = ts::take_from_sender<sui::package::Publisher>(&scenario);
        let (mut policy, cap) = contracts::create_transfer_policy(&publisher, ts::ctx(&mut scenario));
        let policy_id = object::id(&policy);
        log_object_id(tag, step, b"TransferPolicy object id", &policy_id);
        step = step + 1;
        let policy_cap_id = object::id(&cap);
        log_object_id(tag, step, b"TransferPolicyCap object id", &policy_cap_id);
        step = step + 1;

        // 収益分配ルールを追加
        contracts::add_revenue_share_rule(&mut policy, &cap, athlete, one_championship, platform);
        log_step_bytes(
            tag,
            step,
            b"Created transfer policy and configured 70%/25%/5% revenue split",
        );
        step = step + 1;

        sui::transfer::public_share_object(policy);
        sui::transfer::public_transfer(cap, admin);
        ts::return_to_sender(&scenario, publisher);
    };

    // AdminがKioskを作成してNFTを出品
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // Kioskを作成
        let (mut seller_kiosk, seller_cap) = kiosk::new(ts::ctx(&mut scenario));
        let seller_kiosk_id = object::id(&seller_kiosk);
        log_object_id(tag, step, b"Seller kiosk object id", &seller_kiosk_id);
        step = step + 1;
        let seller_cap_id = object::id(&seller_cap);
        log_object_id(tag, step, b"KioskOwnerCap object id", &seller_cap_id);
        step = step + 1;

        // NFTを発行
        let admin_cap = ts::take_from_sender<contracts::AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Purchase Test NFT"),
            string::utf8(b"For purchase flow"),
            string::utf8(b"blob-purchase"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        // NFTのIDを取得
        nft_id = sui::object::id(&nft);
        log_object_id(tag, step, b"NFT object id", &nft_id);
        step = step + 1;

        // NFTをKioskに配置して出品
        kiosk::place(&mut seller_kiosk, &seller_cap, nft);
        kiosk::list<contracts::PremiumTicketNFT>(&mut seller_kiosk, &seller_cap, nft_id, 25_000_000);
        log_step_bytes(tag, step, b"Listed NFT for 0.025 SUI (25_000_000 MIST)");
        step = step + 1;

        ts::return_to_sender(&scenario, admin_cap);
        sui::transfer::public_share_object(seller_kiosk);
        sui::transfer::public_transfer(seller_cap, admin);
    };

    // Buyerが購入
    ts::next_tx(&mut scenario, buyer);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, buyer, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let mut seller_kiosk = ts::take_shared<Kiosk>(&scenario);
        let policy = ts::take_shared<TransferPolicy<contracts::PremiumTicketNFT>>(&scenario);

        // 購入用のコインを作成（0.025 SUI = 25,000,000 MIST）
        let payment = coin::mint_for_testing<SUI>(25_000_000, ts::ctx(&mut scenario));

        // Kioskから購入（Transfer Requestが作成される）
        let (nft, mut request) = kiosk::purchase<contracts::PremiumTicketNFT>(
            &mut seller_kiosk,
            nft_id,
            payment
        );
        log_step_bytes(tag, step, b"Buyer executed kiosk purchase and obtained TransferRequest");
        step = step + 1;

        // 収益分配を実行（Transfer Requestにレシートを追加）
        let revenue_payment = coin::mint_for_testing<SUI>(25_000_000, ts::ctx(&mut scenario));
        contracts::split_revenue(&policy, &mut request, revenue_payment, ts::ctx(&mut scenario));
        log_step_bytes(
            tag,
            step,
            b"split_revenue executed (payment split & transferred to revenue accounts)",
        );
        step = step + 1;

        // Transfer Requestを確認（ルール適用完了）
        sui::transfer_policy::confirm_request(&policy, request);

        // NFTをbuyerに転送
        sui::transfer::public_transfer(nft, buyer);

        ts::return_shared(seller_kiosk);
        ts::return_shared(policy);
    };

    // 購入後の検証
    ts::next_tx(&mut scenario, buyer);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, buyer, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // BuyerがNFTを所有していることを確認
        let nft = ts::take_from_sender<contracts::PremiumTicketNFT>(&scenario);
        assert!(contracts::name(&nft) == string::utf8(b"Purchase Test NFT"), 0);
        let mut detail = b"name=";
        vector::append(&mut detail, string::into_bytes(contracts::name(&nft)));
        log_step_bytes(tag, step, detail);
        step = step + 1;
        ts::return_to_sender(&scenario, nft);
    };

    // 収益分配の検証
    ts::next_tx(&mut scenario, athlete);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, athlete, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 17_500_000, 1); // 70% of 0.025 SUI
        log_u64(tag, step, b"Athlete coin amount", coin::value(&coin));
        step = step + 1;
        ts::return_to_sender(&scenario, coin);
    };

    ts::next_tx(&mut scenario, one_championship);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, one_championship, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 6_250_000, 2); // 25% of 0.025 SUI
        log_u64(tag, step, b"ONE coin amount", coin::value(&coin));
        step = step + 1;
        ts::return_to_sender(&scenario, coin);
    };

    ts::next_tx(&mut scenario, platform);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, platform, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 1_250_000, 3); // 5% of 0.025 SUI
        log_u64(tag, step, b"Platform coin amount", coin::value(&coin));
        ts::return_to_sender(&scenario, coin);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, platform, b"Tx digest (before end)");
    ts::end(scenario);
}

// テスト7: Transfer Policy収益分配（構造確認）
// Note: 実際の収益分配はデプロイ時にTransfer Policyで設定
// このテストは基本的な構造が正しいことを確認
#[test]
fun test_transfer_policy_revenue_split() {
    let admin = @0xA;
    let _athlete = @0xB;
    let _one_championship = @0xC;
    let _platform = @0xD;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_transfer_policy_revenue_split]";
    let mut step = 1;
    log_scenario(b"Scenario 8: verify revenue math for 70%/25%/5% split");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module");
        step = step + 1;
    };

    // 収益分配アドレスの確認
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // 分配比率の確認（70% / 25% / 5%）
        let athlete_bp: u16 = 7000;  // 70%
        let one_bp: u16 = 2500;       // 25%
        let platform_bp: u16 = 500;   // 5%
        let total_bp: u16 = athlete_bp + one_bp + platform_bp;

        // 合計が10000 basis points (100%)であることを確認
        assert!(total_bp == 10000, 0);

        // 実際の分配額計算のテスト（0.025 SUI = 25,000,000 MIST）
        let purchase_amount: u64 = 25_000_000;
        let athlete_amount = (purchase_amount as u128 * (athlete_bp as u128) / 10000) as u64;
        let one_amount = (purchase_amount as u128 * (one_bp as u128) / 10000) as u64;
        let platform_amount = (purchase_amount as u128 * (platform_bp as u128) / 10000) as u64;

        // 分配額の確認
        assert!(athlete_amount == 17_500_000, 1);     // 70% of 0.025 SUI
        assert!(one_amount == 6_250_000, 2);         // 25% of 0.025 SUI
        assert!(platform_amount == 1_250_000, 3);     // 5% of 0.025 SUI

        // 合計が元の金額と一致（丸め誤差考慮）
        let total_distributed = athlete_amount + one_amount + platform_amount;
        assert!(total_distributed == purchase_amount, 4);
        log_u64(tag, step, b"Athlete share (MIST)", athlete_amount);
        step = step + 1;
        log_u64(tag, step, b"ONE share (MIST)", one_amount);
        step = step + 1;
        log_u64(tag, step, b"Platform share (MIST)", platform_amount);
        step = step + 1;
        log_u64(tag, step, b"Total distributed (MIST)", total_distributed);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (before end)");
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = sui::transfer_policy::ERuleAlreadySet)]
fun test_transfer_policy_duplicate_rule_fails() {
    let admin = @0xA;
    let athlete = @0xB;
    let one = @0xC;
    let platform = @0xD;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_transfer_policy_duplicate_rule_fails]";
    let mut step = 1;
    log_scenario(b"Scenario 9: transfer policy rejects duplicate rules");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let publisher = ts::take_from_sender<sui::package::Publisher>(&scenario);
        let (mut policy, cap) = contracts::create_transfer_policy(&publisher, ts::ctx(&mut scenario));
        let policy_id = object::id(&policy);
        log_object_id(tag, step, b"TransferPolicy object id", &policy_id);
        step = step + 1;
        let cap_id = object::id(&cap);
        log_object_id(tag, step, b"TransferPolicyCap object id", &cap_id);
        step = step + 1;
        contracts::add_revenue_share_rule(&mut policy, &cap, athlete, one, platform);
        log_step_bytes(
            tag,
            step,
            b"Rule: each TransferPolicy rule can be set only once; re-adding should abort with sui::transfer_policy::ERuleAlreadySet (code=0x3)",
        );

        // 2回目の追加でERuleAlreadySetが発生することを期待
        contracts::add_revenue_share_rule(&mut policy, &cap, athlete, one, platform);

        ts::return_to_sender(&scenario, publisher);
        ts::return_to_sender(&scenario, policy);
        ts::return_to_sender(&scenario, cap);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (before end)");
    ts::end(scenario);
}

// ====== Transfer Policy統合テスト ======

// テスト8: Transfer Policy統合テスト（作成・ルール追加・収益分配）
#[test]
fun test_transfer_policy_integration() {

    let admin = @0xA;
    let athlete = @0xB;
    let one_championship = @0xC;
    let platform = @0xD;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_transfer_policy_integration]";
    let mut step = 1;
    log_scenario(b"Scenario 7: create transfer policy and verify rules");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化（PublisherとAdminCapを取得）
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module");
        step = step + 1;
    };

    // Transfer Policyを作成し、収益分配ルールを追加
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let publisher = ts::take_from_sender<sui::package::Publisher>(&scenario);

        // Transfer Policyを作成
        let (mut policy, cap) = contracts::create_transfer_policy(
            &publisher,
            ts::ctx(&mut scenario)
        );
        let policy_id = object::id(&policy);
        log_object_id(tag, step, b"TransferPolicy object id", &policy_id);
        step = step + 1;
        let cap_id = object::id(&cap);
        log_object_id(tag, step, b"TransferPolicyCap object id", &cap_id);
        step = step + 1;

        // 収益分配ルールを追加
        contracts::add_revenue_share_rule(
            &mut policy,
            &cap,
            athlete,
            one_championship,
            platform
        );
        log_step_bytes(tag, step, b"Added revenue share rule (70%/25%/5%)");
        step = step + 1;

        // ルールが正しく設定されたことを確認
        let config = contracts::get_revenue_share_config(&policy);
        assert!(contracts::athlete_bp(config) == 7000, 0);
        assert!(contracts::one_bp(config) == 2500, 1);
        assert!(contracts::platform_bp(config) == 500, 2);
        log_u64(tag, step, b"Athlete basis points", contracts::athlete_bp(config) as u64);
        step = step + 1;
        log_u64(tag, step, b"ONE basis points", contracts::one_bp(config) as u64);
        step = step + 1;
        log_u64(tag, step, b"Platform basis points", contracts::platform_bp(config) as u64);

        // Policyを共有オブジェクトとして公開
        sui::transfer::public_share_object(policy);
        sui::transfer::public_transfer(cap, admin);
        ts::return_to_sender(&scenario, publisher);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (before end)");
    ts::end(scenario);
}

// ====== Phase 1: Seal統合テスト ======

// テスト: seal_approve_nft関数のテスト（NFT所有確認成功）
#[test]
fun test_seal_approve_nft_success() {
    let admin = @0xA;
    let user = @0xB;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_seal_approve_nft_success]";
    let mut step = 1;
    log_scenario(b"Scenario: seal_approve_nft succeeds when user owns NFT");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    // AdminがNFTを発行してユーザーに転送
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Seal Test NFT"),
            string::utf8(b"For seal_approve_nft test"),
            string::utf8(b"blob-seal-test"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        // NFTをユーザーに転送
        sui::transfer::public_transfer(nft, user);

        ts::return_to_sender(&scenario, admin_cap);
        log_step_bytes(tag, step, b"Admin minted NFT and transferred to user");
        step = step + 1;
    };

    // ユーザーがseal_approve_nftを呼び出す（成功するはず）
    ts::next_tx(&mut scenario, user);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, user, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let ticket = ts::take_from_sender<PremiumTicketNFT>(&scenario);
        let mut id = vector::empty<u8>();
        vector::push_back(&mut id, 1);

        // seal_approve_nft_internalを呼び出す（成功するはず）
        contracts::seal_approve_nft_internal(id, &ticket, user);

        log_step_bytes(tag, step, b"seal_approve_nft succeeded (user owns NFT)");
        step = step + 1;

        ts::return_to_sender(&scenario, ticket);
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, user, b"Tx digest (before end)");
    ts::end(scenario);
}

// テスト: seal_approve_nft関数のテスト（NFT所有確認失敗）
// 仕様書とタスクリストに従って、E_NOT_NFT_OWNERエラーでabortすることを確認する
#[test]
#[expected_failure(abort_code = E_NOT_NFT_OWNER)]
fun test_seal_approve_nft_failure() {
    let admin = @0xA;
    let owner = @0xB;
    let non_owner = @0xC;
    let mut scenario = ts::begin(admin);
    let tag = b"[test_seal_approve_nft_failure]";
    let mut step = 1;
    log_scenario(b"Scenario: seal_approve_nft aborts when user does not own NFT");
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (initial)");
    step = step + 1;

    // コントラクトを初期化
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
        log_step_bytes(tag, step, b"Initialized module and issued AdminCap");
        step = step + 1;
    };

    // AdminがNFTを発行して所有者に転送
    ts::next_tx(&mut scenario, admin);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, admin, b"Tx digest (next_tx)");
    step = step + 1;
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut nfts = contracts::mint_batch(
            &admin_cap,
            1,
            string::utf8(b"Seal Test NFT"),
            string::utf8(b"For seal_approve_nft test"),
            string::utf8(b"blob-seal-test"),
            ts::ctx(&mut scenario)
        );

        let nft = vector::pop_back(&mut nfts);
        vector::destroy_empty(nfts);

        // NFTを所有者に転送
        sui::transfer::public_transfer(nft, owner);

        ts::return_to_sender(&scenario, admin_cap);
        log_step_bytes(tag, step, b"Admin minted NFT and transferred to owner");
        step = step + 1;
    };

    log_step_bytes(
        tag,
        step,
        b"Rule: NFT owner only; aborts with contracts::contracts::E_NOT_NFT_OWNER (code=0x2) if violated",
    );
    step = step + 1;

    // 非所有者がseal_approve_nftを呼び出す（失敗するはず）
    ts::next_tx(&mut scenario, non_owner);
    log_current_tx_digest_for_sender(tag, step, &mut scenario, non_owner, b"Tx digest (next_tx)");
    step = step + 1;
    {
        // 非所有者が所有者のNFTを参照しようとする
        let ticket = ts::take_from_address<PremiumTicketNFT>(&scenario, owner);
        let mut id = vector::empty<u8>();
        vector::push_back(&mut id, 1);

        // この呼び出しはabortするはず（所有確認はテストシナリオで実行される）
        contracts::seal_approve_nft_internal_with_ownership_check(id, &ticket, non_owner, &mut scenario);

        // ここには到達しない
        ts::return_to_address(owner, ticket);
        log_step_bytes(tag, step, b"Unexpected: non-owner passed seal_approve_nft");
    };

    log_current_tx_digest_for_sender(tag, step, &mut scenario, non_owner, b"Tx digest (before end)");
    ts::end(scenario);
}
