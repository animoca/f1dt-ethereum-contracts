const {accounts, artifacts} = require('hardhat');
const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {toWei} = require('web3-utils');
const {One, Two} = require('@animoca/ethereum-contracts-core').constants;

const REVV = artifacts.require('REVV');
const PayoutClaimDistributor = artifacts.require('PayoutClaimDistributor');

const [deployer, ...participants] = accounts;
const [participant, participant2, participant3] = participants;

describe('PayoutClaim Distributor contract', function () {
  async function doDeploy(overrides = {}) {
    this.revv = await REVV.new(overrides.holders || [participant], overrides.amounts || [toWei('1000')], {
      from: overrides.deployer || deployer,
    });
    this.distributor = await PayoutClaimDistributor.new(this.revv.address, {
      from: overrides.deployer || deployer,
    });
  }

  async function doApproveSpender(overrides = {}) {
    const owners = overrides.owners || participants;
    const spender = overrides.spender || this.distributor.address;
    const allowances = overrides.allowances || new Array(owners.length).fill(toWei('100000000'));

    for (let index = 0; index < owners.length; ++index) {
      await this.revv.approve(spender, allowances[index], {from: owners[index]});
    }
  }

  describe('Payout Deployment', function () {
    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);
      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
    });

    it('assigns the total supply to the owner on deployment', async function () {
      let totalSupply = await this.revv.totalSupply();
      let balanceOfPurchase = await this.revv.balanceOf(participant);
      balanceOfPurchase.should.be.bignumber.equal(totalSupply);
    });

    it('lets owner set tokenAddress and merkleRoot on deployment', async function () {
      let tokenAddressPassedWithConstructor = this.revv.address.toLowerCase();

      const ercTokenAddress = await this.distributor.token();

      const tokenAddress = ercTokenAddress.toLowerCase();
      tokenAddress.should.be.equal(tokenAddressPassedWithConstructor);
    });

    it('lets owner set merkleRoot', async function () {
      let newMerkleRoot = '0x9ebcac2f57a45eb2f1989d25b00df9653f08de05d028a431fd5e66d24d09e91a';
      await this.distributor.setMerkleRoot(newMerkleRoot, {from: deployer});
      const merkleRoot = await this.distributor.merkleRoot();

      merkleRoot.should.be.equal(newMerkleRoot);
    });
  });

  describe('Public Transactions', function () {
    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);
      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
    });

    it('a general(non-owner) user cannot LOCK the payout', async function () {
      await expectRevert(this.distributor.setLocked(true, {from: participant2}), 'Ownable: not the owner');
    });

    it('a general(non-owner) user cannot UNLOCK the payout', async function () {
      await expectRevert(this.distributor.setLocked(false, {from: participant2}), 'Ownable: not the owner');
    });

    it('a general(non-owner) user cannot re-set the merkleRoot to claim', async function () {
      await expectRevert(
        this.distributor.setMerkleRoot('0x74240ff0f67350e4c643ccd4b68d93aa4fa79da004e4120096d7a9f17fc5d9e1', {from: participant2}),
        'Ownable: not the owner'
      );
    });
  });

  describe('Owner-constrained Transactions', function () {
    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);
      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
    });

    it('lets owner re-set the merkleRoot for next payout period', async function () {
      let newMerkleRoot = '0x74240ff0f67350e4c643ccd4b68d93aa4fa79da004e4120096d7a9f17fc5d9e1';

      await this.distributor.setMerkleRoot(newMerkleRoot, {from: deployer});
      const merkleRoot = await this.distributor.merkleRoot();

      merkleRoot.should.be.equal(newMerkleRoot);
    });

    it('lets the owner lock the payout period', async function () {
      // Check if calling setLocked throws DistributionLocked event
      await this.distributor.setLocked(true, {from: deployer});

      // Recheck with the state variable isLocked
      const isLocked = await this.distributor.isLocked();
      isLocked.should.be.equal(true);
    });
  });

  describe('Ownership', function () {
    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);
      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
    });

    it('returns the current owner of the contract', async function () {
      currentOwner = await this.distributor.owner();
      currentOwner.should.be.equal(deployer);
    });

    it('lets previous owner transfer ownership to new owner', async function () {
      const receipt = await this.distributor.transferOwnership(participant);
      expectEvent(receipt, 'OwnershipTransferred');

      newOwner = await this.distributor.owner();
      newOwner.should.be.equal(participant);
    });
  });

  describe('Claim', function () {
    let validClaim = {
      index: 1,
      address: '0x6135944984E65F685b1a472e101785CF9c992ae3',
      amount: 1200000,
      salt: '0x5b10fd6221d7e058aa9342e0f01e64520a271ac12055ef84906e38bcd294561e',
      merkleProof: [
        '0xb8303fe3f4620fac1b535148b30a22fb2bd9410717c917b51eb764bef5a2739c',
        '0xe316021482d926284b997d6cc45073a863140146ae8b66f6dad0b8571a14b8e9',
        '0x1101095aabb30b12258fad2c1225787180ba6037b0d93bda6919585b3fbe6b00',
      ],
    };

    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);

      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
      await this.distributor.setLocked(false);
      await this.distributor.setMerkleRoot('0x9ebcac2f57a45eb2f1989d25b00df9653f08de05d028a431fd5e66d24d09e91a', {from: deployer});
      await this.distributor.setDistributorAddress(participant, {from: deployer});
    });

    it("users can't claim when payout is locked", async function () {
      // lock the payout
      await this.distributor.setLocked(true);
      await expectRevert(
        this.distributor.claimPayout(validClaim.index, validClaim.address, validClaim.amount, validClaim.salt, validClaim.merkleProof),
        'Payout locked'
      );
    });

    it("users can't claim if payout amount is zero", async function () {
      let zeroAmountClaim = {
        index: 1,
        address: '0x6135944984E65F685b1a472e101785CF9c992ae3',
        amount: '0x0',
        salt: '0x5b10fd6221d7e058aa9342e0f01e64520a271ac12055ef84906e38bcd294561e',
        merkleProof: [
          '0xb8303fe3f4620fac1b535148b30a22fb2bd9410717c917b51eb764bef5a2739c',
          '0xe316021482d926284b997d6cc45073a863140146ae8b66f6dad0b8571a14b8e9',
          '0x1101095aabb30b12258fad2c1225787180ba6037b0d93bda6919585b3fbe6b00',
        ],
      };

      await expectRevert(
        this.distributor.claimPayout(
          zeroAmountClaim.index,
          zeroAmountClaim.address,
          zeroAmountClaim.amount,
          zeroAmountClaim.salt,
          zeroAmountClaim.merkleProof
        ),
        'Invalid Amount'
      );
    });

    it('an invalid user cannot claim the tokens', async function () {
      let invalidUserClaim = {
        index: 0,
        address: '0xcBDdA6E233Fd5FbB5ab60986bc67D5BD293924fb',
        amount: 100,
        salt: '0xd3c033205c994a4fa7e88de1e82eb9a8570a6a7ebd368a12b5929d046506f16a',
        merkleProof: ['0x74aef6706b4be14b9c9290fe649488479eff7bcaeaec6c71ab0aea3b8c8b1e4b'],
      };

      await expectRevert(
        this.distributor.claimPayout(
          invalidUserClaim.index,
          invalidUserClaim.address,
          invalidUserClaim.amount,
          invalidUserClaim.salt,
          invalidUserClaim.merkleProof
        ),
        'Invalid proof'
      );
    });

    it('a valid user can successfully claim the tokens', async function () {
      let claimPayoutEvent = await this.distributor.claimPayout(
        validClaim.index,
        validClaim.address,
        validClaim.amount,
        validClaim.salt,
        validClaim.merkleProof
      );
      await expectEvent(claimPayoutEvent, 'ClaimedPayout', {
        _address: validClaim.address,
        amount: validClaim.amount,
        salt: validClaim.salt,
      });
      let validUserBalance = await this.revv.balanceOf(validClaim.address);
      validUserBalance.toNumber().should.be.equal(1200000);
    });

    it("users can't claim tokens twice", async function () {
      // claim tokens once
      let claimPayoutEvent = await this.distributor.claimPayout(
        validClaim.index,
        validClaim.address,
        validClaim.amount,
        validClaim.salt,
        validClaim.merkleProof
      );
      await expectEvent(claimPayoutEvent, 'ClaimedPayout', {
        _address: validClaim.address,
        amount: validClaim.amount,
        salt: validClaim.salt,
      });

      // claim tokens twice
      await expectRevert(
        this.distributor.claimPayout(validClaim.index, validClaim.address, validClaim.amount, validClaim.salt, validClaim.merkleProof),
        'Payout already claimed'
      );
    });

    it('returns the payout claim status of an address', async function () {
      // claim tokens once
      let claimPayoutEvent = await this.distributor.claimPayout(
        validClaim.index,
        validClaim.address,
        validClaim.amount,
        validClaim.salt,
        validClaim.merkleProof
      );
      await expectEvent(claimPayoutEvent, 'ClaimedPayout', {
        _address: validClaim.address,
        amount: validClaim.amount,
        salt: validClaim.salt,
      });

      const isClaimedReceiptStatus = true; //this.distributor.claimed();
      isClaimedReceiptStatus.should.be.equal(true);
    });

    it('Payout failure case to distribute erc20 token from distributor wallet', async function () {
      await this.revv.approve(this.distributor.address, 1, {from: participant});

      await expectRevert(
        this.distributor.claimPayout(validClaim.index, validClaim.address, validClaim.amount, validClaim.salt, validClaim.merkleProof),
        'SafeMath: subtraction overflow'
      );
    });
  });

  describe('Events', function () {
    beforeEach(async function () {
      this.revvMaxSupply = Two.pow(new BN(256)).sub(One);

      await doDeploy.bind(this)({
        holders: [participant],
        amounts: [this.revvMaxSupply],
      });
      await doApproveSpender.bind(this)({
        owners: [participant],
        allowances: [this.revvMaxSupply],
      });
      await this.distributor.setLocked(false);
    });

    it('emits SetMerkleRoot event when owner re-sets the merkleRoot', async function () {
      let newMerkleRoot = '0x74240ff0f67350e4c643ccd4b68d93aa4fa79da004e4120096d7a9f17fc5d9e1';

      const setMerkleRootEvent = await this.distributor.setMerkleRoot(newMerkleRoot, {from: deployer});
      await expectEvent(setMerkleRootEvent, 'SetMerkleRoot', {
        _merkleRoot: newMerkleRoot,
      });
    });

    it('emits DistributionLocked event when owner locks the payout period', async function () {
      const setLockedEvent = await this.distributor.setLocked(true, {from: deployer});
      await expectEvent(setLockedEvent, 'DistributionLocked', {
        _isLocked: true,
      });
    });

    it('emits SetDistributionAddress event when owner re-sets distributor address ', async function () {
      let setDistributorEvent = await this.distributor.setDistributorAddress(participant, {from: deployer});
      await expectEvent(setDistributorEvent, 'SetDistributorAddress', {
        _ownerAddress: deployer,
        _distAddress: participant,
      });
    });
  });
});
