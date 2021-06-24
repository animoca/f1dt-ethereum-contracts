// disabled until registry dependencies are fixed for sale_base

// /* eslint-disable mocha/no-setup-in-describe */
// /* eslint-disable prettier/prettier */
// const {accounts, artifacts, web3} = require('hardhat');
// const {BN, ether, expectRevert} = require('@openzeppelin/test-helpers');
// const {stringToBytes32} = require('@animoca/ethereum-contracts-sale_base/test/utils/bytes32');
// const {ZeroAddress, EmptyByte, Two, Three} = require('@animoca/ethereum-contracts-core').constants;
// const {makeNonFungibleTokenId} = require('@animoca/blockchain-inventory_metadata').inventoryIds;

// const Sale = artifacts.require('FixedOrderTrackSaleMock');
// const ERC20 = artifacts.require('ERC20Mock');

// const erc20TotalSupply = ether('1000000000');
// const purchaserErc20Balance = ether('100000');
// const recipientErc20Balance = ether('100000');
// const erc20Price = ether('1');

// const nfMaskLength = 32;
// const token1 = makeNonFungibleTokenId(1, 1, nfMaskLength);
// const token2 = makeNonFungibleTokenId(2, 1, nfMaskLength);
// const token3 = makeNonFungibleTokenId(3, 1, nfMaskLength);
// const tokens = [token1, token2, token3];

// const tokensPerSkuCapacity = Two;
// const sku = stringToBytes32('sku');
// const maxQuantityPerPurchase = Three;
// const notificationsReceiver = ZeroAddress;

// const userData = EmptyByte;

// const [deployer, payoutWallet, purchaser, recipient] = accounts;

// describe('FixedOrderTrackSale', function () {
//   async function doDeployErc20(overrides = {}) {
// this.erc20 = await ERC20.new(
//   [overrides.from || deployer],
//   [overrides.erc20TotalSupply || erc20TotalSupply],
//   {from: overrides.from || deployer}
// );

//     await this.erc20.transfer(overrides.purchaser || purchaser, overrides.purchaserErc20Balance || purchaserErc20Balance, {
//       from: overrides.from || deployer,
//     });

//     await this.erc20.transfer(overrides.recipient || recipient, overrides.recipientErc20Balance || recipientErc20Balance, {
//       from: overrides.from || deployer,
//     });
//   }

//   async function doDeployInventory(overrides = {}) {
//     const Bytes = artifacts.require('artifacts_v0:Bytes');
//     const bytes = await Bytes.new({from: deployer});
//     const Inventory = artifacts.require('artifacts_v0:DeltaTimeInventory');
//     await Inventory.link(bytes);
//     this.inventory = await Inventory.new(ZeroAddress, ZeroAddress, {from: overrides.from || deployer});

//     this.tokens = overrides.tokens || tokens;
//   }

//   async function doDeploySale(overrides = {}) {
//     this.sale = await Sale.new(
//       overrides.inventory || this.inventory.address,
//       overrides.payoutWallet || payoutWallet,
//       overrides.tokensPerSkuCapacity || tokensPerSkuCapacity,
//       {from: overrides.from || deployer}
//     );
//   }

//   async function doAddSupply(overrides = {}) {
//     await this.sale.addSupply(overrides.tokens || tokens, {from: overrides.from || deployer});
//   }

//   async function doCreateSku(overrides = {}) {
//     await this.sale.methods['createSku(bytes32,uint256,address)'](
//       overrides.sku || sku,
//       overrides.maxQuantityPerPurchase || maxQuantityPerPurchase,
//       overrides.notificationReceiver || notificationsReceiver,
//       {from: overrides.from || deployer}
//     );
//   }

//   async function doUpdateSkuPricing(overrides = {}) {
//     await this.sale.updateSkuPricing(overrides.sku || sku, [overrides.erc20Address || this.erc20.address], [overrides.erc20Price || erc20Price], {
//       from: overrides.from || deployer,
//     });
//   }

//   async function doSetMinterRole(overrides = {}) {
//     await this.inventory.addMinter(overrides.operator || this.sale.address, {from: overrides.from || deployer});
//   }

//   describe('createSku()', function () {
//     beforeEach(async function () {
//       await doDeployInventory.bind(this)();
//       await doDeploySale.bind(this)();
//     });

//     describe('when the contract is not paused', function () {
//       it('reverts', async function () {
//         await this.sale.start({from: deployer});

//         await expectRevert(doCreateSku.bind(this)(), 'Pausable: not paused');
//       });
//     });

//     describe('when initial sale supply has not been defined', function () {
//       it('reverts', async function () {
//         const tokenList = await this.sale.getTokenList();

//         await expectRevert(doCreateSku.bind(this)({totalSupply: new BN(tokenList.length + 1)}), 'Sale: zero supply');
//       });
//     });

//     describe('when successful', function () {
//       beforeEach(async function () {
//         this.skus = await this.sale.getSkus();

//         await doAddSupply.bind(this)();
//         await doCreateSku.bind(this)();
//       });

//       it('creates the sku correctly', async function () {
//         const skus = await this.sale.getSkus();
//         skus.length.should.equal(this.skus.length + 1);
//       });
//     });
//   });

//   describe('_delivery()', function () {
//     beforeEach(async function () {
//       await doDeployErc20.bind(this)();
//       await doDeployInventory.bind(this)();
//       await doDeploySale.bind(this)();
//       await doAddSupply.bind(this)();
//       await doCreateSku.bind(this)();
//       await doUpdateSkuPricing.bind(this)();
//     });

//     describe('when this contract does not have the inventory contract minter role', function () {
//       const quantity = Two;

//       it('reverts', async function () {
// await expectRevert(
//   this.sale.underscoreDelivery(
//     recipient,
//     this.erc20.address,
//     sku,
//     quantity,
//     userData,
//     quantity.mul(erc20Price),
//     [],
//     [],
//     {from: purchaser}
//   ),
//   'MinterRole: caller does not have the Minter role'
// );
//       });
//     });

//     describe('when successful', function () {
//       const quantity = Two;

//       beforeEach(async function () {
//         await doSetMinterRole.bind(this)();

//         this.tokenList = await this.sale.getTokenList();
//         this.tokenIndex = await this.sale.tokenIndex();
//         this.exists = [];

//         for (var index = 0; index < quantity; index++) {
//           const token = this.tokenList[index];
//           this.exists.push(await this.inventory.exists(token));
//         }

//         await this.sale.underscoreDelivery(recipient, this.erc20.address, sku, quantity, userData, quantity.mul(erc20Price), [], [], {
//           from: purchaser,
//         });
//       });

//       it('updates the token index correctly', async function () {
//         const tokenIndex = await this.sale.tokenIndex();
//         tokenIndex.should.be.bignumber.equal(this.tokenIndex.add(quantity));
//       });

//       it('mints the purchased tokens', async function () {
//         for (var index = 0; index < quantity; index++) {
//           this.exists[index].should.be.false;
//           const token = this.tokenList[index];
//           const exists = await this.inventory.exists(token);
//           exists.should.be.true;
//         }
//       });

//       it('delivers the purchased goods correctly', async function () {
//         for (var index = 0; index < quantity; index++) {
//           const token = this.tokenList[index];
//           const owner = await this.inventory.ownerOf(token);
//           owner.should.be.equal(recipient);
//         }
//       });
//     });
//   });
// });
