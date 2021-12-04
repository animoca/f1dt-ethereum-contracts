const {accounts} = require('hardhat');

const {shouldRevertAndNotUnstakeNft, shouldStakeNft, shouldTimeWarpBy, shouldUnstakeNft, shouldDisable, initialiseDebug} = require('../behaviors');

const [creator, staker] = accounts;

const earlyUnstakeScenario = function () {
  before(function () {
    initialiseDebug.bind(this)(staker);
  });

  describe("when unstaking an NFT that hasn't been staked", function () {
    shouldRevertAndNotUnstakeNft(staker, 0, 'NftStaking: token not staked or incorrect token owner');
  });

  describe('when immediatley trying to unstake an NFT after staking', function () {
    shouldStakeNft(staker, 0);
    shouldRevertAndNotUnstakeNft(staker, 0, 'NftStaking: token still frozen');
  });

  describe('when waiting 1 cycle before trying to unstake', function () {
    shouldTimeWarpBy({cycles: 1}, {cycle: 2});
    shouldRevertAndNotUnstakeNft(staker, 0, 'NftStaking: token still frozen');
  });

  describe('when waiting another cycle before trying to unstake', function () {
    shouldTimeWarpBy({cycles: 1}, {cycle: 3});
    shouldUnstakeNft(staker, 0);
  });

  describe('when disabling then unstaking', function () {
    shouldTimeWarpBy({cycles: 1}, {cycle: 4});
    shouldStakeNft(staker, 0);
    shouldTimeWarpBy({cycles: 1}, {cycle: 5});
    shouldDisable(creator);
    shouldUnstakeNft(staker, 0, {noHistoryUpdate: true});
  });
};

module.exports = {
  earlyUnstakeScenario,
};
