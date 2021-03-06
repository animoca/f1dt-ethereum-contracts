// disabled until registry dependencies are fixed for sale_base

// const {accounts, artifacts} = require('hardhat');
// const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
// const ContractDeployer = require('../helpers/ContractDeployer');
// const TokenBehavior = require('./TokenBehaviors');
// const {stringToBytes32} = require('@animoca/ethereum-contracts-sale_base/test/utils/bytes32');
// const {ZeroAddress, EmptyByte} = require('@animoca/ethereum-contracts-core').constants;
// const {toWei} = require('web3-utils');
// const TOKENS = ContractDeployer.TOKENS;

// const [deployer, operation, payoutWallet, ...participants] = accounts;
// const [participant, participant2, participant3, participant4] = participants;

// const maxQuantity = toWei('200');

// describe('scenario', function () {
//   before(async function () {
//     this.revv = await ContractDeployer.deployREVV({from: deployer});

//     // //CrateKey Sale
//     this.sale = await ContractDeployer.deployCrateKeyFullSale({from: deployer}, payoutWallet);

//     this.keys = await ContractDeployer.deployCrateKeyTokens({from: deployer}, operation);
//     const {F1DT_CCK, F1DT_RCK, F1DT_ECK, F1DT_LCK} = this.keys;
//     this.f1dtCck = F1DT_CCK;
//     this.f1dtEck = F1DT_ECK;
//     this.f1dtLck = F1DT_LCK;
//     this.f1dtRck = F1DT_RCK;
//   });

//   describe('Sales(setup SKU)', function () {
//     TokenBehavior.createCrateKeyTokens();

//     it("add Common Crate Keys sku('F1DT.CCK')", async function () {
//       // Simulate a sku value
//       const tokenObject = TOKENS.F1DT_CCK;
//       const tokenContract = this.f1dtCck;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const fullsaleSupply = tokenObject.fullsaleSupply;
//       await tokenContract.approve(this.sale.address, fullsaleSupply, {from: operation});
//       const receipt = await this.sale.createCrateKeySku(sku, fullsaleSupply, maxQuantity, tokenContract.address, {
//         from: deployer,
//       });
//       expectEvent(receipt, 'SkuCreation', {
//         sku: sku,
//         totalSupply: fullsaleSupply,
//         maxQuantityPerPurchase: maxQuantity,
//         notificationsReceiver: ZeroAddress,
//       });
//     });

//     it("add Common Crate Keys sku('F1DT.RCK')", async function () {
//       // Simulate a sku value
//       const tokenObject = TOKENS.F1DT_RCK;
//       const tokenContract = this.f1dtRck;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const fullsaleSupply = tokenObject.fullsaleSupply;
//       await tokenContract.approve(this.sale.address, fullsaleSupply, {from: operation});
//       const receipt = await this.sale.createCrateKeySku(sku, fullsaleSupply, maxQuantity, tokenContract.address, {
//         from: deployer,
//       });
//       expectEvent(receipt, 'SkuCreation', {
//         sku: sku,
//         totalSupply: fullsaleSupply,
//         maxQuantityPerPurchase: maxQuantity,
//         notificationsReceiver: ZeroAddress,
//       });
//     });

//     it("add Common Crate Keys sku('F1DT.ECK')", async function () {
//       // Simulate a sku value
//       const tokenObject = TOKENS.F1DT_ECK;
//       const tokenContract = this.f1dtEck;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const fullsaleSupply = tokenObject.fullsaleSupply;
//       await tokenContract.approve(this.sale.address, fullsaleSupply, {from: operation});
//       const receipt = await this.sale.createCrateKeySku(sku, fullsaleSupply, maxQuantity, tokenContract.address, {
//         from: deployer,
//       });
//       expectEvent(receipt, 'SkuCreation', {
//         sku: sku,
//         totalSupply: fullsaleSupply,
//         maxQuantityPerPurchase: maxQuantity,
//         notificationsReceiver: ZeroAddress,
//       });
//     });

//     it("add Common Crate Keys sku('F1DT.LCK')", async function () {
//       // Simulate a sku value
//       const tokenObject = TOKENS.F1DT_LCK;
//       const tokenContract = this.f1dtLck;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const fullsaleSupply = tokenObject.fullsaleSupply;
//       await tokenContract.approve(this.sale.address, fullsaleSupply, {from: operation});
//       const receipt = await this.sale.createCrateKeySku(sku, fullsaleSupply, maxQuantity, tokenContract.address, {
//         from: deployer,
//       });
//       expectEvent(receipt, 'SkuCreation', {
//         sku: sku,
//         totalSupply: fullsaleSupply,
//         maxQuantityPerPurchase: maxQuantity,
//         notificationsReceiver: ZeroAddress,
//       });
//     });

//     it('update sku price for all skus', async function () {
//       for (const tokenObject of Object.values(TOKENS)) {
//         const actualPrice = new BN(tokenObject.price).div(new BN('2'));
//         const sku = stringToBytes32(tokenObject.symbol);
//         const receipt = await this.sale.updateSkuPricing(sku, [this.revv.address], [actualPrice], {
//           from: deployer,
//         });
//         /* cannot test the array for prices, the test helper is using a array of [bignumber], it is using he deep comparison for each element,
//                     the array in the event is not instantiate by the test, so instance compare will fail.
//                     expectEvent(receipt, "SkuPricingUpdate", {sku, tokens: [this.revv.address], prices:[actualPrice]})
//                 */
//         expectEvent(receipt, 'SkuPricingUpdate', {sku, tokens: [this.revv.address]});

//         const {prices} = await this.sale.getSkuInfo(sku);
//         prices[0].should.be.bignumber.eq(actualPrice);
//       }
//     });
//   });

//   /**        START SALE          */
//   describe('Sales(Start)', function () {
//     it('should start sales', async function () {
//       const receipt = await this.sale.start({from: deployer});
//       await expectEvent(receipt, 'Started', {account: deployer});
//       (await this.sale.startedAt()).should.be.bignumber.gt('0');
//     });
//   });

//   /**        BUY ITEMS          */
//   describe('Sales(Purchase)', function () {
//     /**        PURCHASE ITEMS ON SALE          */
//     it('should be able to purchase all keys once', async function () {
//       for (const tokenObject of Object.values(TOKENS)) {
//         const purchaseQuantity = toWei('1');
//         const sku = stringToBytes32(tokenObject.symbol);
//         const beforePurchaseBal = await this.revv.balanceOf(participant);
//         const actualPrice = new BN(tokenObject.price).div(new BN('2'));
//         const totalPrice = actualPrice.mul(new BN(purchaseQuantity));

//         await this.revv.approve(this.sale.address, totalPrice, {from: participant});

//         const receipt = await this.sale.purchaseFor(participant, this.revv.address, sku, purchaseQuantity, EmptyByte, {from: participant});

//         //Check the event
//         await expectEvent.inTransaction(receipt.tx, this.sale, 'Purchase', {
//           purchaser: participant,
//           recipient: participant,
//           token: this.revv.address,
//           sku: sku,
//           quantity: purchaseQuantity,
//           userData: EmptyByte,
//           totalPrice: toWei(actualPrice),
//         });

//         //Check revv balance
//         const expectedBal = beforePurchaseBal.sub(toWei(actualPrice));
//         const afterPurchaseBal = await this.revv.balanceOf(participant);
//         afterPurchaseBal.should.be.bignumber.eq(expectedBal);
//       }
//     });

//     it('should be able to deliver all keys to the participant', async function () {
//       for (const key of Object.values(this.keys)) {
//         const keyBalance = await key.balanceOf(participant);
//         keyBalance.should.be.bignumber.eq(toWei('1'));
//       }
//     });

//     it('should be able to purchase a cratekey using different purchaser and receiptant', async function () {
//       const purchaseQuantity = toWei('1');
//       const tokenObject = TOKENS.F1DT_CCK;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const beforePurchaseBal = await this.revv.balanceOf(participant3);
//       const actualPrice = new BN(tokenObject.price).div(new BN('2'));
//       const totalPrice = actualPrice.mul(new BN(purchaseQuantity));

//       await this.revv.approve(this.sale.address, totalPrice, {from: participant3});

//       const receipt = await this.sale.purchaseFor(participant2, this.revv.address, sku, purchaseQuantity, EmptyByte, {from: participant3});
//       //Check the event
//       await expectEvent.inTransaction(receipt.tx, this.sale, 'Purchase', {
//         purchaser: participant3,
//         recipient: participant2,
//         token: this.revv.address,
//         sku: sku,
//         quantity: purchaseQuantity,
//         userData: EmptyByte,
//         totalPrice: toWei(actualPrice),
//       });

//       //Check revv balance
//       const expectedBal = beforePurchaseBal.sub(toWei(actualPrice));
//       const afterPurchaseBal = await this.revv.balanceOf(participant3);
//       afterPurchaseBal.should.be.bignumber.eq(expectedBal);

//       //Check key balance
//       const keyBalance = await this.f1dtCck.balanceOf(participant2);
//       keyBalance.should.be.bignumber.eq(toWei('1'));
//     });

//     it('should be able to purchase more than one item', async function () {
//       const tokenObject = TOKENS.F1DT_LCK;
//       const sku = stringToBytes32(tokenObject.symbol);

//       const quantity = toWei('4');
//       const actualPrice = new BN(tokenObject.price).div(new BN('2'));
//       const totalPrice = actualPrice.mul(new BN(quantity));
//       const beforePurchaseBal = await this.revv.balanceOf(participant4);

//       await this.revv.approve(this.sale.address, totalPrice, {from: participant4});

//       const receipt = await this.sale.purchaseFor(participant2, this.revv.address, sku, quantity, EmptyByte, {
//         from: participant4,
//       });
//       //Check the event
//       await expectEvent.inTransaction(receipt.tx, this.sale, 'Purchase', {
//         purchaser: participant4,
//         recipient: participant2,
//         token: this.revv.address,
//         sku: sku,
//         quantity: quantity,
//         userData: EmptyByte,
//         totalPrice: totalPrice,
//       });

//       //Check revv balance
//       const expectedBal = beforePurchaseBal.sub(totalPrice);
//       const afterPurchaseBal = await this.revv.balanceOf(participant4);
//       afterPurchaseBal.should.be.bignumber.eq(expectedBal);

//       //Check key balance
//       const keyBalance = await this.f1dtLck.balanceOf(participant2);
//       keyBalance.should.be.bignumber.eq(toWei('4'));
//     });

//     it('should be able to purchase until out of stock - ECK', async function () {
//       //1049 keys to purchase
//       const tokenObject = TOKENS.F1DT_ECK;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const actualPrice = new BN(tokenObject.price).div(new BN('2'));
//       let skuInfo = await this.sale.getSkuInfo(sku);
//       let remainingSupply = skuInfo.remainingSupply;
//       const maxQuantityPerPurchase = skuInfo.maxQuantityPerPurchase;

//       // console.log("remaining supply of ECK: ", fromWei(remainingSupply));
//       // console.log("max quantity: ", fromWei(maxQuantityPerPurchase));
//       while (remainingSupply.gt(new BN(toWei('0')))) {
//         //Calculate the quantity we are going to purchase
//         const remaining = remainingSupply.sub(maxQuantityPerPurchase);
//         const purchaseQuantity = remaining.gte(new BN(toWei('0'))) ? maxQuantityPerPurchase : remainingSupply;
//         const totalPrice = actualPrice.mul(purchaseQuantity);

//         await this.revv.approve(this.sale.address, totalPrice, {from: participant3});

//         const receipt = await this.sale.purchaseFor(participant2, this.revv.address, sku, purchaseQuantity, EmptyByte, {from: participant3});
//         //Check the event
//         await expectEvent.inTransaction(receipt.tx, this.sale, 'Purchase', {
//           purchaser: participant3,
//           recipient: participant2,
//           token: this.revv.address,
//           sku: sku,
//           quantity: purchaseQuantity,
//           userData: EmptyByte,
//         });

//         //retrieve the remaining supply again
//         skuInfo = await this.sale.getSkuInfo(sku);
//         remainingSupply = skuInfo.remainingSupply;
//       }

//       //Check key balance
//       const keyBalance = await this.f1dtEck.balanceOf(participant2);
//       keyBalance.should.be.bignumber.eq(toWei('1049'));
//     });

//     it('should revert when the key is out of stock - ECK', async function () {
//       const tokenObject = TOKENS.F1DT_ECK;
//       const sku = stringToBytes32(tokenObject.symbol);
//       const quantity = toWei('1');

//       const receipt = this.sale.purchaseFor(participant2, this.revv.address, sku, quantity, EmptyByte, {
//         from: participant3,
//       });

//       await expectRevert(receipt, 'Sale: insufficient supply');
//     });
//   });
// });
