# Changelog

## 3.1.0

### New features

- Added contract `DeltaTimeStaking2021.sol`.

## 3.0.2

### Improvements

- Remove merkle root as constructor argument in `PayoutClaimDistributor.sol`.

## 3.0.1

### Fixes

- Adding `@animoca/ethereum-hardhat-bootstrap` as peer dependency.

## 3.0.0

### Breaking changes

- Migration to `@animoca/ethereum-contract-core@1.0.X`.

### New features

- `PayoutClaimDistributor.sol` contract to manage weekly REVV payouts.

## 2.0.0

### Breaking changes

- Migration to `@animoca/hardhat-bootstrap` and `@animoca/ethereum-contract-core_library@5.0.0`.

### New features

- Added `FixedOrderTrackSale.sol`, a sale contract to handle the purchases of F1® DeltaTime track NFTs.
- Added `CrateKeyFullSale.sol`, a `FixedPricesSale` contract implementation that handles the full price purchase of ERC20 `F1DTCrateKey` tokens.

## 1.0.0

- Updated to `@animoca/ethereum-contracts-nft_staking:4.0.0`.
- Added `TimeTrialEliteLeague.sol`, a contract to manage the participation status of players to the elite tiers.
- Added `CrateKeySale.sol`, a `FixedPricesSale` contract implementation that handles the purchase of ERC20 `F1DTCrateKey` tokens.
- Added `PrePaid.sol`, a contract to manage the pre-paid purchase deposits for a future sale.
- Added `F1DTCrateKey`, an ERC20 contract whose tokens represent a purchasable 'key' used to open a lootbox crate.
- Added `Crates2020RNGLib.sol`, `Crates2020.sol` and `Crates2020Locksmith.sol` for crate keys opening.
- Added `DeltaTimeStaking.sol`, an NFT V2 staking contract that requires escrow of REVV. Drivers become stakeable with a weight half on the cars weight.

## 0.4.0

- Added `NFTRepairCentre`, a contract to manage defunct NFTs.
- Updated to `@animoca/ethereum-contracts-core:3.1.1`.
- Updated to `@animoca/ethereum-contracts-sale_base:6.0.0`.
- Removed `RaceEntrySale.sol` sale contract, tests, and sample migration script.
- Updated `QualifyingGameSale.sol` with `@animoca/ethereum-contracts-sale_base:6.0.0` compatibility changes.
- Added `REVVSale`.

## 0.3.0

- Updated to `@animoca/ethereum-contracts-sale_base@4.0.0`.
- Compatibility changes for `RaceEntrySale.sol` to use `@animoca/ethereum-contracts-sale_base@4.0.0`.
- Added `QualifyingGameSale.sol` sale contract.
- Updated to `@animoca/ethereum-contracts-nft_staking:3.0.3`.

## 0.2.3

- Updated to `@animoca-ethereum-nft_staking@3.0.1` and `@animoca-ethereum-assets_inventory@4.0.0`.
- Added documentation for `REVV`.
- Linting configuration.
- Migrated to `yarn`.

## 0.2.2

- Optimise values retrieval in token id for staking.

## 0.2.1

- Improved checks on NFT type for staking.

## 0.2.0

- Updated to `@animoca/ethereum-contracts-nft_staking:3.0.0`.
- Updated to `@animoca/ethereum-contracts-sale_base:3.0.0`.

## 0.1.0

- Renamed `DeltaTimeInventory` to `DeltaTimeInventoryV2`.
- Added solidity source for previously deployed contracts.
- Added `DeltaTimeStakingBetaV2`.

## 0.0.1

- Initial commit.
