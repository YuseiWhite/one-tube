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