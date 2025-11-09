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