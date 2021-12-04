const {accounts} = require('hardhat');

const {shouldStakeNft, shouldRevertAndNotStakeNft, shouldRevertAndNotUnstakeNft, mintStakerTokens} = require('../behaviors');

const [creator, staker, otherStaker] = accounts;

const invalidNftOwnerScenario = function () {
  before(async function () {
    await mintStakerTokens.bind(this)(otherStaker);
  });

  describe('when staking an NFT', function () {
    shouldStakeNft(staker, 0);

    describe('when staking an already staked NFT', function () {
      shouldRevertAndNotStakeNft(staker, 0, 'Inventory: non-owned NFT');
    });

    describe('when unstaking an NFT not owned by the caller', function () {
      shouldRevertAndNotUnstakeNft(staker, 0, 'NftStaking: token not staked or incorrect token owner', {
        owner: otherStaker,
      });
    });
  });
};

module.exports = {
  invalidNftOwnerScenario,
};
