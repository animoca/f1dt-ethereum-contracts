const {accounts, artifacts, web3} = require('hardhat');
const {time} = require('@openzeppelin/test-helpers');
const {getCoreMetadata} = require('@animoca/f1dt-core_metadata').utils;
const {crates, expectedTypes} = require('./Crates2020RNGLib.constants');
const {computeSupply, validateSupplies, validateSubTypeSupplies} = require('./Crates2020RNGLib.helpers');

const Crates2020RNGLib = artifacts.require('Crates2020RNGLibMock');

const sampleSize = 10000;

const [deployer] = accounts;

describe('Crates2020RNGLib', function () {
  describe('generateCrate', function () {
    before(async function () {
      this.generator = await Crates2020RNGLib.new(1, {from: deployer});
    });

    const maxGasUsed = 28000;

    it(`@skip-on-coverage uses less than ${maxGasUsed} gas`, async function () {
      // The gas consumption includes storage counter read and update
      const baseTxFee = 13000;
      for (const [key, value] of Object.entries(crates)) {
        const result = await this.generator.generateCrate(value.tier);
        const gasUsed = result.receipt.gasUsed - baseTxFee;
        console.log(`generateCrate(${key}) used ${gasUsed} gas`);
        gasUsed.should.be.lte(maxGasUsed);
      }
    });

    // Long test, remove skip to run it again when constants are updated
    // eslint-disable-next-line mocha/no-skipped-tests
    describe.skip('supplies bounded by specifications', function () {
      this.timeout(0);
      for (const [key, value] of Object.entries(crates)) {
        it(`${key} has expected supply proportions`, async function () {
          const tokens = [];
          for (let i = 0; i < sampleSize; ++i) {
            const result = await this.generator.generateCrate.call(value.tier);
            for (let j = 0; j < 5; ++j) {
              const meta = getCoreMetadata(result[j].toString());
              tokens.push(meta);
            }
            await time.increase();
          }
          const tokenSupplies = computeSupply(tokens);
          console.log(key, tokenSupplies);
          validateSubTypeSupplies('Gear', tokenSupplies.supplyBySubType.Gear, tokenSupplies.supplyByType.Gear);
          validateSubTypeSupplies('Part', tokenSupplies.supplyBySubType.Part, tokenSupplies.supplyByType.Part);
          validateSubTypeSupplies('Tyres', tokenSupplies.supplyBySubType.Tyres, tokenSupplies.supplyByType.Tyres);
          validateSupplies('Type', tokenSupplies.supplyByType, expectedTypes, tokenSupplies.total);
          validateSupplies('Tier', tokenSupplies.supplyByTier, value.expectedRarities, tokenSupplies.total);
        });
      }
    });
  });
});
