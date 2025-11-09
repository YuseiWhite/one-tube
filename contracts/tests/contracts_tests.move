#[test_only]
module contracts::contracts_tests;

use contracts::contracts::{Self, PremiumTicketNFT, AdminCap};
use sui::test_scenario::{Self as ts};
use std::string;

// テスト: NFT mint_batch関数
#[test]
fun test_mint_batch() {
    let admin = @0xA;
    let mut scenario = ts::begin(admin);

    // コントラクトを初期化（adminがAdminCapを受け取る）
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    // 10個のNFTを発行
    ts::next_tx(&mut scenario, admin);
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
    {
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);
        assert!(contracts::name(&nft) == string::utf8(b"ONE 170 Premium Ticket"), 1);
        assert!(contracts::description(&nft) == string::utf8(b"Access to full match videos"), 2);
        assert!(contracts::blob_id(&nft) == string::utf8(b"mock-blob-id-123"), 3);
        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

// テスト: 管理者のみがミント可能（権限テスト）
#[test]
#[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
fun test_mint_requires_admin_cap() {
    let admin = @0xA;
    let unauthorized = @0xB;
    let mut scenario = ts::begin(admin);

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    // AdminCapなしでミントを試行（失敗が期待される）
    ts::next_tx(&mut scenario, unauthorized);
    {
        // 期待される失敗箇所: 権限のないユーザーがAdminCapの取得を試みる
        // EEmptyInventoryエラーでabortする（ユーザーがAdminCapを所有していないため）
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

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

    ts::end(scenario);
}

// ====== Phase 2 & 3: 所有権・アクセス制御テスト ======

// テスト: NFT所有権の確認（SDKチェックをシミュレート）
#[test]
fun test_nft_ownership_verification() {
    let admin = @0xA;
    let user = @0xB;
    let mut scenario = ts::begin(admin);

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    // AdminがNFTを発行してユーザーに転送
    ts::next_tx(&mut scenario, admin);
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
    };

    // ユーザーがNFTを受け取る（所有権確認）
    ts::next_tx(&mut scenario, user);
    {
        // ユーザーがNFTを取得できれば、所有していることを意味する
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);

        // NFTプロパティを検証
        assert!(contracts::name(&nft) == string::utf8(b"Ownership Test NFT"), 0);
        assert!(contracts::blob_id(&nft) == string::utf8(b"blob-ownership"), 1);

        // NFTをユーザーに返却
        ts::return_to_sender(&scenario, nft);
    };

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

    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    // AdminがNFTを発行して所有者に転送
    ts::next_tx(&mut scenario, admin);
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
    };

    // 非所有者がNFTを取得しようとする（失敗が期待される）
    ts::next_tx(&mut scenario, non_owner);
    {
        // 期待される失敗箇所: 非所有者が所有していないNFTの取得を試みる
        // EEmptyInventoryエラーでabortする（non_ownerはNFTを所有していないため）
        let nft = ts::take_from_sender<PremiumTicketNFT>(&scenario);

        // ここには到達しない
        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

// ====== Phase 2: Kiosk統合テスト ======

// テスト5: Kioskへの出品と取り下げ
#[test]
fun test_kiosk_list_and_delist() {
    use sui::kiosk;

    let admin = @0xA;
    let mut scenario = ts::begin(admin);

    // コントラクトを初期化
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    // AdminがKioskを作成してNFTを発行
    ts::next_tx(&mut scenario, admin);
    {
        // Kioskを作成
        let (mut kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));

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

        // NFTをKioskに配置
        kiosk::place(&mut kiosk, &kiosk_cap, nft);

        // 配置されたことを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 0);

        // NFTを出品（0.5 SUI = 500,000,000 MIST）
        kiosk::list<PremiumTicketNFT>(&mut kiosk, &kiosk_cap, nft_id, 500_000_000);

        // 出品後も存在することを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 1);

        // 出品を取り下げ
        kiosk::delist<PremiumTicketNFT>(&mut kiosk, &kiosk_cap, nft_id);

        // 取り下げ後もKiosk内に存在することを確認
        assert!(kiosk::has_item(&kiosk, nft_id), 2);

        ts::return_to_sender(&scenario, admin_cap);
        sui::transfer::public_share_object(kiosk);
        sui::transfer::public_transfer(kiosk_cap, admin);
    };

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

    // コントラクトを初期化（PublisherとAdminCapを取得）
    {
        contracts::init_for_testing(ts::ctx(&mut scenario));
    };

    let nft_id: sui::object::ID;

    // Transfer Policyをセットアップ
    ts::next_tx(&mut scenario, admin);
    {
        let publisher = ts::take_from_sender<sui::package::Publisher>(&scenario);
        let (mut policy, cap) = contracts::create_transfer_policy(&publisher, ts::ctx(&mut scenario));

        // 収益分配ルールを追加
        contracts::add_revenue_share_rule(&mut policy, &cap, athlete, one_championship, platform);

        sui::transfer::public_share_object(policy);
        sui::transfer::public_transfer(cap, admin);
        ts::return_to_sender(&scenario, publisher);
    };

    // AdminがKioskを作成してNFTを出品
    ts::next_tx(&mut scenario, admin);
    {
        // Kioskを作成
        let (mut seller_kiosk, seller_cap) = kiosk::new(ts::ctx(&mut scenario));

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

        // NFTをKioskに配置して出品
        kiosk::place(&mut seller_kiosk, &seller_cap, nft);
        kiosk::list<contracts::PremiumTicketNFT>(&mut seller_kiosk, &seller_cap, nft_id, 500_000_000);

        ts::return_to_sender(&scenario, admin_cap);
        sui::transfer::public_share_object(seller_kiosk);
        sui::transfer::public_transfer(seller_cap, admin);
    };

    // Buyerが購入
    ts::next_tx(&mut scenario, buyer);
    {
        let mut seller_kiosk = ts::take_shared<Kiosk>(&scenario);
        let policy = ts::take_shared<TransferPolicy<contracts::PremiumTicketNFT>>(&scenario);

        // 購入用のコインを作成（0.5 SUI = 500,000,000 MIST）
        let payment = coin::mint_for_testing<SUI>(500_000_000, ts::ctx(&mut scenario));

        // Kioskから購入（Transfer Requestが作成される）
        let (nft, mut request) = kiosk::purchase<contracts::PremiumTicketNFT>(
            &mut seller_kiosk,
            nft_id,
            payment
        );

        // 収益分配を実行（Transfer Requestにレシートを追加）
        let revenue_payment = coin::mint_for_testing<SUI>(500_000_000, ts::ctx(&mut scenario));
        contracts::split_revenue(&policy, &mut request, revenue_payment, ts::ctx(&mut scenario));

        // Transfer Requestを確認（ルール適用完了）
        sui::transfer_policy::confirm_request(&policy, request);

        // NFTをbuyerに転送
        sui::transfer::public_transfer(nft, buyer);

        ts::return_shared(seller_kiosk);
        ts::return_shared(policy);
    };

    // 購入後の検証
    ts::next_tx(&mut scenario, buyer);
    {
        // BuyerがNFTを所有していることを確認
        let nft = ts::take_from_sender<contracts::PremiumTicketNFT>(&scenario);
        assert!(contracts::name(&nft) == string::utf8(b"Purchase Test NFT"), 0);
        ts::return_to_sender(&scenario, nft);
    };

    // 収益分配の検証
    ts::next_tx(&mut scenario, athlete);
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 350_000_000, 1); // 70%
        ts::return_to_sender(&scenario, coin);
    };

    ts::next_tx(&mut scenario, one_championship);
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 125_000_000, 2); // 25%
        ts::return_to_sender(&scenario, coin);
    };

    ts::next_tx(&mut scenario, platform);
    {
        let coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&coin) == 25_000_000, 3); // 5%
        ts::return_to_sender(&scenario, coin);
    };

    ts::end(scenario);
}