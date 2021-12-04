// disabled until registry dependencies are fixed for sale_base

// const {accounts, artifacts} = require('hardhat');
// const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
// const {toWei} = require('web3-utils');
// const {ZeroAddress, Zero, One, Two} = require('@animoca/ethereum-contracts-core').constants;
// const {stringToBytes32} = require('@animoca/ethereum-contracts-sale_base/test/utils/bytes32');

// const Sale = artifacts.require('CrateKeyFullSale');
// const CrateKey = artifacts.require('F1DTCrateKey');
// const REVV = artifacts.require('REVV');

// const [deployer, payoutWallet, purchaser, holder] = accounts;

// const sku = stringToBytes32('sku');

// describe('CrateKeyFullSale', function () {
//   async function doDeploy(overrides = {}) {
//     this.revv = await REVV.new(overrides.revvHolders || [purchaser], overrides.revvAmounts || [toWei('1000')], {
//       from: overrides.deployer || deployer,
//     });

//     this.sale = await Sale.new(overrides.payoutWallet || payoutWallet, {
//       from: overrides.deployer || deployer,
//     });

//     this.crateKey = await CrateKey.new(
//       overrides.crateKeySymbol || 'CK',
//       overrides.crateKeyName || 'Crate Key',
//       overrides.crateKeyUri || 'https://localhost/uri',
//       overrides.crateKeyHolder || holder,
//       overrides.crateKeySupply || new BN(10),
//       {
//         from: overrides.deployer || deployer,
//       }
//     );
//   }

//   async function doCreateSku(overrides = {}) {
//     await this.sale.createCrateKeySku(
//       overrides.sku || sku,
//       overrides.skuTotalSupply || One,
//       overrides.skuMaxQuantityPerPurchase || One,
//       this.crateKey.address,
//       {from: overrides.deployer || deployer}
//     );
//   }

//   async function doUpdateSkuPricing(overrides = {}) {
//     await this.sale.updateSkuPricing(overrides.sku || sku, overrides.tokens || [this.revv.address], overrides.prices || [Two], {from: deployer});
//   }

//   async function doSetApproval(overrides = {}) {
//     await this.crateKey.approve(this.sale.address, overrides.skuTotalSupply || One, {from: overrides.holder || holder});
//   }

//   async function doStartSalePeriod(overrides = {}) {
//     await this.sale.start({
//       from: overrides.deployer || deployer,
//     });
//   }

//   describe('createCrateKeySku', function () {
//     beforeEach(async function () {
//       await doDeploy.bind(this)();
//     });

//     it('reverts if called by any other than the contract owner', async function () {
//       const revert = this.sale.createCrateKeySku(sku, One, One, this.crateKey.address, {from: purchaser});
//       await expectRevert(revert, 'Ownable: caller is not the owner');
//     });

//     it('reverts if the total supply is unlimited', async function () {
//       const totalSupply = await this.sale.SUPPLY_UNLIMITED();
//       const revert = this.sale.createCrateKeySku(sku, totalSupply, One, this.crateKey.address, {from: deployer});
//       await expectRevert(revert, 'CrateKeyFullSale: invalid total supply');
//     });

//     it('reverts if the crate key is the zero address', async function () {
//       const revert = this.sale.createCrateKeySku(sku, One, One, ZeroAddress, {from: deployer});
//       await expectRevert(revert, 'CrateKeyFullSale: zero address');
//     });

//     it('reverts if the sku already exists', async function () {
//       await this.sale.createCrateKeySku(sku, One, One, this.crateKey.address, {from: deployer});
//       const revert = this.sale.createCrateKeySku(sku, One, One, this.crateKey.address, {from: deployer});
//       await expectRevert(revert, 'Sale: sku already created');
//     });

//     it('reverts if total supply is zero', async function () {
//       const revert = this.sale.createCrateKeySku(sku, Zero, One, this.crateKey.address, {from: deployer});
//       await expectRevert(revert, 'Sale: zero supply');
//     });

//     it('reverts if creating more than the fixed SKU capacity of 4', async function () {
//       for (let index = 0; index < 4; ++index) {
//         const crateKey = await CrateKey.new('CK', 'Crate Key', 'https://localhost/uri', holder, new BN(10), {from: deployer});
//         const sku = stringToBytes32(`sku${index}`);
//         await this.sale.createCrateKeySku(sku, One, One, crateKey.address, {from: deployer});
//       }
//       const crateKey = await CrateKey.new('CK', 'Crate Key', 'https://localhost/uri', holder, new BN(10), {from: deployer});
//       const sku = stringToBytes32(`exceededSkuCapacity`);
//       const revert = this.sale.createCrateKeySku(sku, One, One, crateKey.address, {from: deployer});
//       await expectRevert(revert, 'Sale: too many skus');
//     });

//     it('creates the sku', async function () {
//       const receipt = await this.sale.createCrateKeySku(sku, One, One, this.crateKey.address, {from: deployer});
//       expectEvent(receipt, 'SkuCreation', {
//         sku: sku,
//         totalSupply: One,
//         maxQuantityPerPurchase: One,
//         notificationsReceiver: ZeroAddress,
//       });
//     });

//     it('binds the crate key with the sku', async function () {
//       const crateKeyBefore = await this.sale.crateKeys(sku);
//       crateKeyBefore.should.equal(ZeroAddress);
//       await this.sale.createCrateKeySku(sku, One, One, this.crateKey.address, {from: deployer});
//       const crateKeyAfter = await this.sale.crateKeys(sku);
//       crateKeyAfter.should.equal(this.crateKey.address);
//     });
//   });

//   describe('updateSkuPricing()', function () {
//     it('reverts if setting the price with a token that exceeds the fixed SKU token capacity of 4', async function () {
//       await doDeploy.bind(this)();
//       await doCreateSku.bind(this)();
//       const numErc20s = 5;
//       const erc20s = [];

//       for (var index = 0; index < numErc20s; index++) {
//         const erc20 = await REVV.new([purchaser], [toWei('1000')], {from: deployer});
//         erc20s.push(erc20.address);
//       }

//       const revert = this.sale.updateSkuPricing(sku, erc20s, new Array(numErc20s).fill(One), {from: deployer});

//       await expectRevert(revert, 'Sale: too many tokens');
//     });
//   });

//   describe('_delivery()', function () {
//     beforeEach(async function () {
//       await doDeploy.bind(this)();
//       await doCreateSku.bind(this)();
//       await doUpdateSkuPricing.bind(this)();
//       await doSetApproval.bind(this)();
//     });

//     it('reverts if the holder has an insufficient crate key token balance for delivery', async function () {
//       const skuInfo = await this.sale.getSkuInfo(sku);
//       const price = skuInfo.prices[0];
//       const amount = price;
//       const quantity = skuInfo.totalSupply;
//       await this.revv.approve(this.sale.address, amount, {from: purchaser});
//       await doStartSalePeriod.bind(this)();
//       const balance = await this.crateKey.balanceOf(holder);
//       await this.crateKey.transfer(deployer, balance, {from: holder});
//       const revert = this.sale.purchaseFor(purchaser, this.revv.address, sku, quantity, '0x', {from: purchaser});
//       await expectRevert(revert, 'ERC20: transfer amount exceeds balance');
//     });

//     it('reverts if the sale contract has an insufficient crate key token allowance for delivery', async function () {
//       const skuInfo = await this.sale.getSkuInfo(sku);
//       const price = skuInfo.prices[0];
//       const amount = price;
//       const quantity = skuInfo.totalSupply;
//       await this.crateKey.approve(this.sale.address, Zero, {from: holder});
//       await this.revv.approve(this.sale.address, amount, {from: purchaser});
//       await doStartSalePeriod.bind(this)();
//       const revert = this.sale.purchaseFor(purchaser, this.revv.address, sku, quantity, '0x', {from: purchaser});
//       await expectRevert(revert, 'ERC20: transfer amount exceeds allowance');
//     });

//     it('delivers', async function () {
//       const skuInfo = await this.sale.getSkuInfo(sku);
//       const price = skuInfo.prices[0];
//       const amount = price;
//       const quantity = One;
//       await this.revv.approve(this.sale.address, amount, {from: purchaser});
//       await doStartSalePeriod.bind(this)();
//       const balanceBefore = await this.crateKey.balanceOf(purchaser);
//       const supplyBefore = await this.crateKey.balanceOf(holder);
//       const expectedBalance = balanceBefore.add(quantity);
//       const expectedSupply = supplyBefore.sub(quantity);
//       await this.sale.purchaseFor(purchaser, this.revv.address, sku, quantity, '0x', {from: purchaser});
//       const actualBalance = await this.crateKey.balanceOf(purchaser);
//       const actualSupply = await this.crateKey.balanceOf(holder);
//       actualBalance.should.be.bignumber.equal(expectedBalance);
//       actualSupply.should.be.bignumber.equal(expectedSupply);
//     });
//   });
// });
