const {artifacts, accounts} = require('hardhat');
const {expectRevert} = require('@openzeppelin/test-helpers');
const {shouldSupportInterfaces} = require('@animoca/ethereum-contracts-core').behaviors;
const {interfaces} = require('@animoca/ethereum-contracts-assets');
const {EmptyByte, ZeroAddress} = require('@animoca/ethereum-contracts-core').constants;

const {MigrationRewardSchedule, FlatRewardSchedule} = require('./constants');
const {deploy, start} = require('./init');
const TokenHelper = require('./utils/tokenHelper');

const {
  preconditionsScenario,
  multiNftStakingScenario,
  multiNftStakingSinglePeriodScenario,
  multiNftStakingMultiPeriodScenario,
  periodLimitsScenario,
  multiStakersScenario,
  multiStakersSinglePeriodScenario,
  multiStakersMultiPeriodScenario,
  gasHeavyScenario,
  restakeScenario,
  nonWhitelistedNftContractScenario,
  batchStakeScenario,
  // batchUnstakeScenario,
  earlyUnstakeScenario,
  earlyRestakeScenario,
  claimScenario,
  invalidNftOwnerScenario,
  rewardsScheduleScenario,
  // lostCyclesScenario,
  withdrawRewardsScenario,
} = require('./scenarios');

const [creator, staker] = accounts;

/* eslint-disable mocha/no-sibling-hooks */

describe('DeltaTimeStaking2021', function () {
  describe('Reverts', function () {
    before(deploy);

    it('reverts with wrong constructor parameters', async function () {
      await expectRevert(
        artifacts.require('DeltaTimeStaking2021').new(1, 1, ZeroAddress, ZeroAddress, [], [], {from: creator}),
        'NftStaking: invalid cycle length'
      );
      await expectRevert(
        artifacts.require('DeltaTimeStaking2021').new(60, 1, ZeroAddress, ZeroAddress, [], [], {from: creator}),
        'NftStaking: invalid period length'
      );
    });

    it('returns 0 current period before start', async function () {
      const currentPeriod = await this.stakingContract.getCurrentPeriod();
      currentPeriod.should.be.bignumber.equal('0');
    });

    it('reverts when estimating rewards before start', async function () {
      await expectRevert(this.stakingContract.estimateRewards(1, {from: staker}), 'NftStaking: staking not started');
    });

    it('reverts when calling start after already started', async function () {
      await this.stakingContract.start({from: creator});
      await expectRevert(this.stakingContract.start({from: creator}), 'NftStaking: staking has started');
    });
  });

  describe('Preconditions', function () {
    before(deploy);
    before(start);

    preconditionsScenario();
  });

  describe('Token conditions', function () {
    before(deploy);
    before(start);

    it('stakes a 2020 car', async function () {
      const tokenId = TokenHelper.makeTokenId(TokenHelper.Rarities.Apex, TokenHelper.Types.Car, TokenHelper.Seasons[2020]);
      await this.nftContract.mint(staker, tokenId, {from: creator});
      await this.nftContract.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](
        staker,
        this.stakingContract.address,
        tokenId,
        1,
        EmptyByte,
        {from: staker}
      );
    });

    it('reverts when staking a non-car token', async function () {
      const tokenId = TokenHelper.makeTokenId(TokenHelper.Rarities.Apex, TokenHelper.Types.Driver);
      await this.nftContract.mint(staker, tokenId, {from: creator});
      await expectRevert(
        this.nftContract.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](
          staker,
          this.stakingContract.address,
          tokenId,
          1,
          EmptyByte,
          {from: staker}
        ),
        'NftStaking: wrong token'
      );
    });

    it('reverts when staking a wrong season car', async function () {
      const tokenId = TokenHelper.makeTokenId(TokenHelper.Rarities.Apex, TokenHelper.Types.Car, TokenHelper.Seasons[2018]);
      await this.nftContract.mint(staker, tokenId, {from: creator});
      await expectRevert(
        this.nftContract.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](
          staker,
          this.stakingContract.address,
          tokenId,
          1,
          EmptyByte,
          {from: staker}
        ),
        'NftStaking: wrong token'
      );
    });
  });

  describe('[[Scenario]] Multi NFT Staking', function () {
    before(deploy);
    before(start);

    multiNftStakingScenario();
  });

  describe('[[Scenario]] Multi NFT Staking (single period)', function () {
    before(deploy);
    before(start);

    multiNftStakingSinglePeriodScenario();
  });

  describe('[[Scenario]] Multi NFT Staking (multi period)', function () {
    before(deploy);
    before(start);

    multiNftStakingMultiPeriodScenario();
  });

  describe('[[Scenario]] Period Limits', function () {
    before(deploy);
    before(start);

    periodLimitsScenario();
  });

  describe('[[Scenario]] Multi Stakers', function () {
    before(deploy);
    before(start);

    multiStakersScenario();
  });

  describe('[[Scenario]] Multi Stakers (single period)', function () {
    before(deploy);
    before(start);

    multiStakersSinglePeriodScenario();
  });

  describe('[[Scenario]] Multi Stakers (multi period)', function () {
    before(deploy);
    before(start);

    multiStakersMultiPeriodScenario();
  });

  describe('[[Scenario]] Gas Heavy', function () {
    before(deploy);
    before(function () {
      return start.bind(this)(FlatRewardSchedule);
    });

    gasHeavyScenario();
  });

  describe('[[Scenario]] Restake', function () {
    before(deploy);
    before(function () {
      return start.bind(this)(MigrationRewardSchedule);
    });

    restakeScenario();
  });

  describe('[[Scenario]] Non-Whitelisted NFT Contract', function () {
    before(deploy);
    before(start);

    nonWhitelistedNftContractScenario();
  });

  describe('[[Scenario]] Batch Stake', function () {
    before(deploy);
    before(start);

    batchStakeScenario();
  });

  // describe('[[Scenario]] Batch Unstake', function () {
  //   before(deploy);
  //   before(start);

  //   batchUnstakeScenario();
  // });

  describe('[[Scenario]] Early Unstake', function () {
    before(deploy);
    before(start);

    earlyUnstakeScenario();
  });

  describe('[[Scenario]] Early Re-stake', function () {
    before(deploy);
    before(start);

    earlyRestakeScenario();
  });

  describe('[[Scenario]] Claim', function () {
    before(deploy);
    before(start);

    claimScenario();
  });

  describe('[[Scenario]] Invalid NFT Owner', function () {
    before(deploy);
    before(start);

    invalidNftOwnerScenario();
  });

  describe('[[Scenario]] RewardsSchedule (pre-start)', function () {
    before(deploy);

    rewardsScheduleScenario(false);
  });

  describe('[[Scenario]] Rewards Schedule (post-start)', function () {
    before(deploy);
    before(start);

    rewardsScheduleScenario(true);
  });

  // describe('[[Scenario]] Lost cycles withdrawal', function () {
  //   before(deploy);
  //   before(start);

  //   lostCyclesScenario(true);
  // });

  describe('[[Scenario]] Withdraw rewards', function () {
    before(deploy);
    before(start);

    withdrawRewardsScenario();
  });

  describe('Interface support', function () {
    before(deploy);
    shouldSupportInterfaces([interfaces.ERC165.ERC1155TokenReceiver]);
  });

  /* eslint-enable mocha/no-sibling-hooks */
});
