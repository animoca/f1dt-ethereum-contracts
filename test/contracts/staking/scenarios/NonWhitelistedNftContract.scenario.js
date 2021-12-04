const {artifacts, accounts} = require('hardhat');
const DefaultNFMaskLength = 32;
const {ZeroAddress} = require('@animoca/ethereum-contracts-core').constants;

const {shouldRevertAndNotStakeNft, shouldRevertAndNotBatchStakeNfts} = require('../behaviors');

const [creator, staker] = accounts;

const nonWhitelistedNftContractScenario = function () {
  before(async function () {
    const registry = await artifacts.require('ForwarderRegistry').new({from: creator});
    this.nftContract = await artifacts.require('ERC1155721InventoryMock').new(registry.address, ZeroAddress, DefaultNFMaskLength, {from: creator});

    for (const tokenId of this.stakerTokens[staker]) {
      await this.nftContract.mint(staker, tokenId, {from: creator});
    }
  });

  describe('when staking a single NFT from an invalid NFT contract', function () {
    shouldRevertAndNotStakeNft(staker, 0, 'NftStaking: contract not whitelisted');
  });

  describe('when staking a batch of NFTs from an invalid NFT contract', function () {
    shouldRevertAndNotBatchStakeNfts(staker, [0, 1, 2, 3], 'NftStaking: contract not whitelisted');
  });
};

module.exports = {
  nonWhitelistedNftContractScenario,
};
