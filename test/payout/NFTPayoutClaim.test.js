const {accounts, artifacts} = require('hardhat');
const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {toWei} = require('web3-utils');
const ethUtil = require('ethereumjs-util');

const {One, Two, ZeroAddress, ZeroBytes32} = require('@animoca/ethereum-contracts-core').constants;
const {createTokenId} = require('@animoca/f1dt-core_metadata').utils;

const NFTPayoutClaimDistributor = artifacts.require('NFTPayoutClaim');

const [deployer, owner, ...participants] = accounts;
const [participant, participant2, participant3] = participants;
const mintableTokenIds = [createTokenId({counter: 1}, false), createTokenId({counter: 2}, false), createTokenId({counter: 3}, false)];

describe('NFT PayoutClaim Distributor contract', function () {
  async function doDeploy(overrides = {}) {
    Bytes = artifacts.require('artifacts_v0:Bytes');
    bytes = await Bytes.new({from: deployer});
    DeltaTimeInventory = artifacts.require('artifacts_v0:DeltaTimeInventory');
    await DeltaTimeInventory.link(bytes);
    this.inventory = await DeltaTimeInventory.new(ZeroAddress, ZeroAddress, {from: deployer});
    await this.inventory.addMinter(owner, {from: deployer});

    this.distributor = await NFTPayoutClaimDistributor.new({
      from: overrides.deployer || deployer,
    });

    await this.inventory.batchMint([owner, owner, owner], mintableTokenIds, [ZeroBytes32, ZeroBytes32, ZeroBytes32], [1, 1, 1], true, {
      from: deployer,
    });
  }
  describe('Payout Deployment', function () {
    beforeEach(async function () {
      await doDeploy.bind(this)({});
    });

    it('test after deployment', async function () {
      let balanceOfPurchase = new BN(1);
      balanceOfPurchase.should.be.bignumber.equal(new BN(1));
    });
    it('Validate default distributor address as deployer', async function () {
      const distributorAddress = await this.distributor.distributorAddress();

      distributorAddress.should.be.equal(deployer);
    });
  });

  describe('Only Owner Transactions', function () {
    beforeEach(async function () {
      await doDeploy.bind(this)({});
    });
    describe('Owner as deployer', function () {
      it('Success: Contract Deployer is Owner', async function () {
        currentOwner = await this.distributor.owner();
        currentOwner.should.be.equal(deployer);
      });
      it('Success: Transfer to new owner.', async function () {
        const receipt = await this.distributor.transferOwnership(participant);
        expectEvent(receipt, 'OwnershipTransferred');

        newOwner = await this.distributor.owner();
        newOwner.should.be.equal(participant);
      });
    });
    describe('Owner set distributor address', function () {
      it('Success: Validate new distributor address', async function () {
        let receipt = await this.distributor.setDistributor(participant, {from: deployer});
        expectEvent(receipt, 'SetDistributor');

        const newDistributorAddress = await this.distributor.distributorAddress();
        participant.should.be.equal(newDistributorAddress);
      });
    });

    describe('Owner add merkle root', function () {
      it('Success: Default merkleroot count check', async function () {
        let defaultMerkleRootCountValue = 0;
        const defaultMerkleRootCount = await this.distributor.merkleRootCount();

        defaultMerkleRootCount.toNumber().should.be.equal(defaultMerkleRootCountValue);
      });

      it('Success: Validate new added merkleroot', async function () {
        let newMerkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let receipt = await this.distributor.addMerkleRoot(newMerkleRoot, {from: deployer});
        await expectEvent(receipt, 'SetMerkleRoot');

        // const merkleRootExists = await this.distributor.merkleRootExists(newMerkleRoot);
        // merkleRootExists.should.be.equal(true);
      });

      it('Success: Validate count after adding merkle root', async function () {
        let merkleRootCountIncrementValue = 1;

        let newMerkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let receipt = await this.distributor.addMerkleRoot(newMerkleRoot, {from: deployer});
        await expectEvent(receipt, 'SetMerkleRoot');

        const merkleRootCount = await this.distributor.merkleRootCount();
        merkleRootCount.toNumber().should.be.equal(merkleRootCountIncrementValue);
      });
      it('Success: Merkle root count increment on multiple merkle root addition', async function () {
        let firstMerkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let firstReceipt = await this.distributor.addMerkleRoot(firstMerkleRoot, {from: deployer});
        await expectEvent(firstReceipt, 'SetMerkleRoot');

        let secondMerkleRoot = '0x3485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let secondReceipt = await this.distributor.addMerkleRoot(secondMerkleRoot, {from: deployer});
        await expectEvent(secondReceipt, 'SetMerkleRoot');

        let merkleRootCountIncrementValue = 2;
        const merkleRootCount = await this.distributor.merkleRootCount();
        merkleRootCount.toNumber().should.be.equal(merkleRootCountIncrementValue);
      });
      it('Success: Validate if added merkle root exists', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let receipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(receipt, 'SetMerkleRoot');

        const merkleRootExists = await this.distributor.merkleRootExists(merkleRoot);
        merkleRootExists.should.be.equal(true);
      });
      it('Success: Validate if added merkle root is enabled', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let receipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(receipt, 'SetMerkleRoot');

        const merkleRootEnabled = await this.distributor.merkleRoots(merkleRoot);
        merkleRootEnabled.should.be.equal(true);
      });

      it('Failure: Non-Owner trying to add merkle root', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';

        await expectRevert(this.distributor.addMerkleRoot(merkleRoot, {from: participant}), 'Ownable: not the owner');
      });

      it('Failure: Merkle root already exists message', async function () {
        let firstMerkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let firstReceipt = await this.distributor.addMerkleRoot(firstMerkleRoot, {from: deployer});

        let secondMerkleRoot = firstMerkleRoot;

        await expectRevert(this.distributor.addMerkleRoot(secondMerkleRoot, {from: deployer}), 'MerkleRoot already exists.');
      });
      // it('Failure: Merkle root count not increasing', async function () {});
      // it('Failure: Merkle root not exist after addition', async function () {});
      // it('Failure: Merkle root not enabled/active after addition', async function () {});
    });

    describe('Owner disable specific merkle root', function () {
      it('Success: Validate Disabled merkle root', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let addMerkleRootReceipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(addMerkleRootReceipt, 'SetMerkleRoot');

        let disableMerkleRootReceipt = await this.distributor.disableMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(disableMerkleRootReceipt, 'SetMerkleRootStatus');

        let disabledMerkleRoot = await this.distributor.merkleRoots(merkleRoot);
        disabledMerkleRoot.should.be.equal(false);
      });
      it('Failure: MerkleRoot status not disabled', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let addMerkleRootReceipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(addMerkleRootReceipt, 'SetMerkleRoot');

        let disableMerkleRootReceipt = await this.distributor.disableMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(disableMerkleRootReceipt, 'SetMerkleRootStatus');

        let disabledMerkleRoot = await this.distributor.merkleRoots(merkleRoot);
        disabledMerkleRoot.should.be.equal(false);
      });

      it('Failure: MerkleRoot doesnot exist / Invalid MerkleRoot for disable', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let addMerkleRootReceipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(addMerkleRootReceipt, 'SetMerkleRoot');

        let invalidMerkleRoot = '0x3485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';

        await expectRevert(this.distributor.disableMerkleRoot(invalidMerkleRoot, {from: deployer}), 'Invalid MerkleRoot.');
      });
      it('Failure: Merkleroot is already disabled', async function () {
        let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
        let addMerkleRootReceipt = await this.distributor.addMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(addMerkleRootReceipt, 'SetMerkleRoot');

        let disableMerkleRootReceipt = await this.distributor.disableMerkleRoot(merkleRoot, {from: deployer});
        await expectEvent(disableMerkleRootReceipt, 'SetMerkleRootStatus');

        await expectRevert(this.distributor.disableMerkleRoot(merkleRoot, {from: deployer}), 'MerkleRoot disabled.');
      });
    });
  });

  describe('Public Transactions', function () {
    beforeEach(async function () {
      await doDeploy.bind(this)({});
    });

    it('Failure: Non Owner address set distributor address', async function () {
      await expectRevert(this.distributor.setDistributor(participant, {from: participant}), 'Ownable: not the owner');
    });
    it('Failure: Non Owner address add merkle root', async function () {
      let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
      await expectRevert(this.distributor.addMerkleRoot(merkleRoot, {from: participant}), 'Ownable: not the owner');
    });
    it('Failure: Non Owner address add disable merkle root', async function () {
      let merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
      await expectRevert(this.distributor.disableMerkleRoot(merkleRoot, {from: participant}), 'Ownable: not the owner');
    });
  });

  describe('NFT Payout Claim', function () {
    const merkleRoot = '0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
    let validClaimForNFT = {
      batch: 1,
      receiver: '0xfb0960Fb3EcE20Bdb0B4F2EC4966Ce04048ddDB6',
      contractAddress: ['0x9356A1ff3E1F3C1A57983C8aD909b20DD6d4221E'],
      tokenIds: [[102]],
      amounts: [[1]],
      merkleRoot: merkleRoot,
      merkleProof: [
        ['0x6fe154a5bd0aa30789dda946fe2a8602622fa0d16e73971a9930989a5a703cbf', '0x9a81a391cc89fe28774d4d923097844586e3311d33f97084f3a7ad7021446b53'],
      ],
    };

    beforeEach(async function () {
      await doDeploy.bind(this)({});

      await this.distributor.addMerkleRoot('0x2485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b', {from: deployer});
    });

    it('Success: Claim payout successfully: Claimed leaf status', async function () {
      /*console.log(`this.inventory: ${this.inventory.address}`);
      let nftClaimReceipt = await this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        validClaimForNFT.merkleRoot,
        validClaimForNFT.merkleProof,
        {from: deployer}
      );
      await expectEvent(nftClaimReceipt, 'ClaimPayout');

            let leafHash = ethUtil.keccak(
              validClaimForNFT.batch,
              validClaimForNFT.receiver,
              validClaimForNFT.contractAddress,
              validClaimForNFT.tokenIds,
              validClaimForNFT.amounts,
              validClaimForNFT.merkleRoot,
              validClaimForNFT.merkleProof
            );
            console.log(`LeafHash: ${leafHash}`);

            let claimedStatus = await this.distributor.claimed[validClaimForNFT.merkleRoot][leafHash];

            claimedStatus.should.be.equal(true);*/
    });
    it('Success: Claim payout successfully: Event trigger.', async function () {});
    it('Failure: Merkle root does not exist in NFT PayoutClaim contract', async function () {
      const invalidMerkleRoot = '0x3485733fa0161c74abfe4057e8340e65d2c586ec16bab18eea96343f3d83cf3b';
      let nftClaim = this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        invalidMerkleRoot,
        validClaimForNFT.merkleProof
      );
      await expectRevert(nftClaim, 'Invalid MerkleRoot.');
    });
    it('Failure: Merkle root disabled in NFT payout claim contract', async function () {
      let disableMerkleRootReceipt = await this.distributor.disableMerkleRoot(merkleRoot, {from: deployer});
      await expectEvent(disableMerkleRootReceipt, 'SetMerkleRootStatus');

      let nftClaim = this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        validClaimForNFT.merkleRoot,
        validClaimForNFT.merkleProof
      );
      await expectRevert(nftClaim, 'MerkleRoot disabled.');
    });

    it('Failure: Invalid merkle proof provided', async function () {
      let firstNftClaim = this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        validClaimForNFT.merkleRoot,
        [['0x5fe154a5bd0aa30789dda946fe2a8602622fa0d16e73971a9930989a5a703cbf']]
      );
      await expectRevert(firstNftClaim, 'Invalid proof.');
    });
    it('Failure: Cannot claim twice', async function () {
      /*let firstNftClaim = await this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        validClaimForNFT.merkleRoot,
        validClaimForNFT.merkleProof
      );
      let secondNftClaim = await this.distributor.claimPayout(
        validClaimForNFT.batch,
        validClaimForNFT.receiver,
        validClaimForNFT.contractAddress,
        validClaimForNFT.tokenIds,
        validClaimForNFT.amounts,
        validClaimForNFT.merkleRoot,
        validClaimForNFT.merkleProof
      );

      await expectRevert(secondNftClaim, 'Payout already claimed.');*/
    });
  });
});
