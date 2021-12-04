const {toWei} = require('web3-utils');
const {accounts} = require('hardhat');
const {ZeroAddress} = require('@animoca/ethereum-contracts-core').constants;

const {
  shouldDisable,
  shouldWithdrawRewardsPool,
  shouldRevertAndNotWithdrawRewardsPool,
  shouldStakeNft,
  shouldUnstakeNft,
  shouldTimeWarpBy,
  initialiseDebug,
  // mintStakerTokens,
} = require('../behaviors');

const [creator, staker /*, otherStaker, anotherStaker*/] = accounts;

const withdrawRewardsScenario = function () {
  before(function () {
    initialiseDebug.bind(this)(staker);
  });

  describe('when the contract is not disabled', function () {
    shouldRevertAndNotWithdrawRewardsPool(1, creator, 'NftStaking: contract is enabled');
  });

  describe('when the contract is disabled, from another account', function () {
    shouldDisable(creator);
    shouldRevertAndNotWithdrawRewardsPool(1, staker, 'Ownable: not the owner');
  });

  describe('when the contract is disabled', function () {
    shouldDisable(creator);
    shouldWithdrawRewardsPool(1, creator);
  });
};

module.exports = {
  withdrawRewardsScenario,
};
