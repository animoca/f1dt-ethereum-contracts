const {toWei} = require('web3-utils');
const {artifacts, accounts} = require('hardhat');

const DefaultNFMaskLength = 32;

const {
  RewardsTokenInitialBalance,
  DayInSeconds,
  CycleLengthInSeconds,
  PeriodLengthInSeconds,
  PeriodLengthInCycles,
  RarityWeights,
  DefaultRewardSchedule,
  RewardsPool,
} = require('./constants');

const {ZeroAddress} = require('@animoca/ethereum-contracts-core').constants;

const {mintStakerTokens} = require('./behaviors/staking.behavior');

const [creator, staker] = accounts;

async function deploy() {
  const registry = await artifacts.require('ForwarderRegistry').new({from: creator});

  this.nftContract = await artifacts.require('ERC1155721InventoryMock').new(registry.address, ZeroAddress, DefaultNFMaskLength, {from: creator});
  this.rewardsToken = await artifacts
    .require('ERC20Mock')
    .new([creator], [RewardsTokenInitialBalance], registry.address, ZeroAddress, {from: creator});

  this.stakingContract = await artifacts.require('DeltaTimeStaking2021').new(
    CycleLengthInSeconds,
    PeriodLengthInCycles,
    this.nftContract.address,
    this.rewardsToken.address,
    RarityWeights.map((x) => x.rarity),
    RarityWeights.map((x) => x.weight),
    {from: creator}
  );

  // for 'interface support' tests
  this.contract = this.stakingContract;

  await this.rewardsToken.approve(this.stakingContract.address, RewardsTokenInitialBalance, {from: creator});

  await mintStakerTokens.bind(this)(staker);
}

async function start(rewardSchedule = DefaultRewardSchedule) {
  for (schedule of rewardSchedule) {
    await this.stakingContract.addRewardsForPeriods(schedule.startPeriod, schedule.endPeriod, toWei(schedule.rewardPerCycle), {from: creator});
  }

  await this.stakingContract.start({from: creator});
  this.cycle = 1;
  this.period = 1;
}

module.exports = {
  deploy,
  start,
};
