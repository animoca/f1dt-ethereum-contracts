// disabled until registry dependencies are fixed for nft_staking

// const {accounts, artifacts, web3} = require('hardhat');
// const {ether, expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
// const {BN, toAscii, toWei, fromWei} = require('web3-utils');
// const {ZeroAddress, ZeroBytes32} = require('@animoca/ethereum-contracts-core').constants;

// const {CycleLengthInSeconds, PeriodLengthInCycles, WeightsByRarity, REVVEscrowingWeightCoefficient} = require('../../src/constants');

// const {createTokenId, getCoreMetadata} = require('@animoca/f1dt-core_metadata').utils;

// const DeltaTimeStaking = artifacts.require('DeltaTimeStakingBeta');
// const REVV = artifacts.require('REVV');

// const [deployer, staker] = accounts;

// const cars = [
//   {rarity: '0', type: 'Driver', season: '2019', model: 'Carbon', counter: '1'},
//   {rarity: '1', type: 'Car', season: '2020', model: 'Riptide', counter: '2'},
// ];

// // const cars = [
// //     {rarity: '0', type: 'Car', season: '2019', model: 'Carbon', counter: '1'},
// //     {rarity: '1', type: 'Car', season: '2019', model: 'Carbon', counter: '2'},
// //     {rarity: '2', type: 'Car', season: '2019', model: 'Carbon', counter: '3'},
// //     {rarity: '3', type: 'Car', season: '2019', model: 'Carbon', counter: '4'},
// //     {rarity: '5', type: 'Car', season: '2019', model: 'Carbon', counter: '5'},
// //     {rarity: '8', type: 'Car', season: '2019', model: 'Carbon', counter: '6'},
// // ];

// const tokenIds = cars.map((car) => createTokenId(car, true));

// const weights = cars.map((car) => new BN(WeightsByRarity[car.rarity]));
// const revvEscrowValues = weights.map((weight) => toWei(weight.mul(REVVEscrowingWeightCoefficient)));

// const revvForEscrowing = revvEscrowValues
//   .slice(0, -1) // not enough to stake the last car
//   .reduce((prev, curr) => prev.add(curr), new BN(0));

// describe('DeltaTimeStaking', function () {
//   describe('staking', function () {
//     beforeEach(async function () {
//       this.revv = await REVV.new([staker], [revvForEscrowing], {from: deployer});
//       const Bytes = artifacts.require('artifacts_v0:Bytes');
//       this.bytes = await Bytes.new({from: deployer});
//       const DeltaTimeInventory = artifacts.require('artifacts_v0:DeltaTimeInventory');
//       await DeltaTimeInventory.link(this.bytes);
//       this.inventory = await DeltaTimeInventory.new(this.revv.address, ZeroAddress, {from: deployer});
//       await this.inventory.batchMint(
//         tokenIds.map(() => staker),
//         tokenIds,
//         tokenIds.map(() => ZeroBytes32),
//         tokenIds.map(() => 1),
//         true,
//         {from: deployer}
//       );
//       this.staking = await DeltaTimeStaking.new(
//         CycleLengthInSeconds,
//         PeriodLengthInCycles,
//         this.inventory.address,
//         this.revv.address,
//         Object.keys(WeightsByRarity),
//         Object.values(WeightsByRarity),
//         {from: deployer}
//       );
//       await this.staking.start({from: deployer});
//     });

//     describe('staking', function () {
//       it('should revert if the NFT has wrong type', async function () {
//         await expectRevert(
//           this.inventory.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](staker, this.staking.address, tokenIds[0], 1, '0x0', {
//             from: staker,
//           }),
//           'NftStaking: wrong token'
//         );
//       });

//       it('should revert if the NFT has wrong season', async function () {
//         await expectRevert(
//           this.inventory.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](staker, this.staking.address, tokenIds[1], 1, '0x0', {
//             from: staker,
//           }),
//           'NftStaking: wrong token'
//         );
//       });
//     });
//   });
// });
