const {accounts, artifacts, web3} = require('hardhat');
const {toWei} = require('web3-utils');

const deployer = accounts[0];
// const deployer = accounts[0];

/**
 * @typedef {{from : string}} Web3Option
 */

/**
 * @async
 * @param {Web3Option} options
 * @param {string[]} addresses
 * @param {string[]} amountPerAccount
 */
module.exports.deployREVV = async function (options = {from: deployer}, addresses = accounts, amountPerAccount = toWei('100000000')) {
  const REVV = artifacts.require('REVV');
  // const REVV = contract.fromArtifact('REVV');
  const amounts = new Array(addresses.length).fill(amountPerAccount);
  this.revv = await REVV.new(addresses, amounts, options);
  return this.revv;
};

/**
 * @async
 * @param {Web3Option} options
 * @param {string} revvAddress
 */
module.exports.deployPrepaid = async function (options = {from: deployer}, revvAddress) {
  if (this.revv || revvAddress) {
    const PrePaid = artifacts.require('PrePaid');
    // const PrePaid = contract.fromArtifact('Prepaid');
    const address = revvAddress || this.revv.address;
    this.prepaid = await PrePaid.new(address, options);
  } else {
    throw new Error('Cannot find Revv Contract');
  }
  return this.prepaid;
};

function getTokenDescription(type) {
  return `F1&#174; Delta Time ${type} Crate Key`;
}

const TOKENS = {
  F1DT_CCK: {
    symbol: 'F1DT.CCK',
    name: getTokenDescription('Common'),
    presaleSupply: toWei('5000'),
    fullsaleSupply: toWei('1700'),
    totalSupply: toWei('6700'),
    price: '800',
    uri: 'https://nft.f1deltatime.com/json/commonKey',
  },
  F1DT_RCK: {
    symbol: 'F1DT.RCK',
    name: getTokenDescription('Rare'),
    presaleSupply: toWei('4000'),
    fullsaleSupply: toWei('1350'),
    totalSupply: toWei('5350'),
    price: '3800',
    uri: 'https://nft.f1deltatime.com/json/rareKey',
  },
  F1DT_ECK: {
    symbol: 'F1DT.ECK',
    name: getTokenDescription('Epic'),
    presaleSupply: toWei('3000'),
    fullsaleSupply: toWei('1050'),
    totalSupply: toWei('4050'),
    price: '18000',
    uri: 'https://nft.f1deltatime.com/json/epicKey',
  },
  F1DT_LCK: {
    symbol: 'F1DT.LCK',
    name: getTokenDescription('Legendary'),
    presaleSupply: toWei('1000'),
    fullsaleSupply: toWei('320'),
    totalSupply: toWei('1320'),
    price: '38000',
    uri: 'https://nft.f1deltatime.com/json/legendaryKey',
  },
};

/**
 * F1DT Tokens Spec
 */
module.exports.TOKENS = TOKENS;

const TOKEN_DECIMALS = '18';

/**
 * Token Decimals Spec
 */
module.exports.TOKEN_DECIMALS = TOKEN_DECIMALS;

async function getCrateKeyInstance(token, accountHolder, options) {
  const F1DTCrateKey = artifacts.require('F1DTCrateKey');
  // const F1DTCrateKey = contract.fromArtifact('F1DTCrateKey');

  return await F1DTCrateKey.new(token.symbol, token.name, token.uri, accountHolder, token.totalSupply, options);
}

/**
 * @async
 * @param {Web3Option} options
 * @param {string} accountHolder
 */
module.exports.deployCrateKeyTokens = async function (options = {from: deployer}, accountHolder) {
  const f1dtCck = await getCrateKeyInstance(TOKENS.F1DT_CCK, accountHolder, options);
  const f1dtEck = await getCrateKeyInstance(TOKENS.F1DT_ECK, accountHolder, options);
  const f1dtLck = await getCrateKeyInstance(TOKENS.F1DT_LCK, accountHolder, options);
  const f1dtRck = await getCrateKeyInstance(TOKENS.F1DT_RCK, accountHolder, options);
  return {
    F1DT_CCK: f1dtCck,
    F1DT_RCK: f1dtRck,
    F1DT_ECK: f1dtEck,
    F1DT_LCK: f1dtLck,
  };
};

/**
 * @async
 * @param {Web3Option} options
 * @param {string} prepaidAddress
 */
module.exports.deployCrateKeySale = async function (options = {from: deployer}, prepaidAddress) {
  if (this.prepaid || prepaidAddress) {
    const CrateKeySale = artifacts.require('CrateKeySale');
    // const CrateKeySale = contract.fromArtifact('CrateKeySale');
    const address = prepaidAddress || this.prepaid.address;
    this.sale = await CrateKeySale.new(address, options);
  } else {
    throw new Error('Cannot find Prepaid Contract');
  }
  return this.sale;
};

/**
 * @async
 * @param {Web3Option} options
 * @param {string} payoutWallet
 */
module.exports.deployCrateKeyFullSale = async function (options = {from: deployer}, payoutWallet) {
  if (this.payoutWallet || payoutWallet) {
    const CrateKeyFullSale = artifacts.require('CrateKeyFullSale');
    // const CrateKeyFullSale = contract.fromArtifact('CrateKeyFullSale');
    const payout = payoutWallet || this.payoutWallet;
    this.sale = await CrateKeyFullSale.new(payout, options);
  } else {
    throw new Error('Cannot find payout wallet');
  }
  return this.sale;
};
