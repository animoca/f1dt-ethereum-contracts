// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.8;
pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/token/ERC1155/IERC1155.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/cryptography/MerkleProof.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/access/Ownable.sol";

// import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
// import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract NFTPayoutClaim is Ownable {

	event SetDistributor(address indexed _address, address indexed _distributorAddress);
	event SetMerkleRoot(address indexed _address, bytes32 _merkleRoot);
	event ClaimPayout(address indexed _fromAddress, address indexed _toAddress, uint256[] _tokenId, uint256[] _amount);
	event SetMerkleRootStatus(bytes32 _merkleRoot, bool _status);

	address public _distributorAddress;

	uint256 merkleRootCounts;
	mapping(bytes32 => uint256) private merkleRootIndex;
	mapping(bytes32 => mapping(bytes32 => bool)) private claimed; // merkleRoot -> (hash, claimed)
	mapping(bytes32 => bool) private merkleRootStatus; // merkleRoot -> disabled

	constructor() public {

	}

	function setDistributor(address distributorAddress) external onlyOwner {
		_distributorAddress = distributorAddress;
		emit SetDistributor(msg.sender, _distributorAddress);
	}

	function _distributor() external view returns (address) {
		return _distributorAddress;
	}

	function addMerkleRoot(bytes32 _merkleRoot) external onlyOwner returns (uint256) {
		require(merkleRootIndex[_merkleRoot] == 0,'NFTPayoutClaim: MerkleRoot already set.');

		uint256 merkleRootCount = merkleRootCounts+1;
		merkleRootIndex[_merkleRoot] = merkleRootCount;

		merkleRootCounts++;
		emit SetMerkleRoot(msg.sender, _merkleRoot);
		return merkleRootCount;
	}

	function setMerkleRootStatus(bytes32 _merkleRoot, bool _status) external onlyOwner {
		require(merkleRootStatus[_merkleRoot] != _status, 'NFTPayoutClaim: Already set status.');

		merkleRootStatus[_merkleRoot] = _status;
		emit SetMerkleRootStatus(_merkleRoot, _status);
	}

	function claimPayout(
		uint256 index,
		bytes32 batch,
		address receiverAddress,
		address[] calldata contractAddress,
		uint256[][] calldata tokenIds,
		uint256[][] calldata amounts,
		bytes32 merkleRoot,
		bytes32[] calldata merkleProof
	) external {
		require(merkleRootIndex[merkleRoot] == 0,'NFTPayoutClaim: Invalid MerkleRoot');
		require(!merkleRootStatus[merkleRoot], 'NFTPayoutClaim: MerkleRoot not enabled.');

		uint i;
		for (i = 0; i < contractAddress.length; i++) {
			address contractAddr = contractAddress[i];

			bytes32 leafHash = keccak256(abi.encodePacked(index, batch, receiverAddress, contractAddr, tokenIds[i], amounts[i]));

			require(!claimed[merkleRoot][leafHash], "NFTPayoutClaim: Payout already claimed");
			require(MerkleProof.verify(merkleProof, merkleRoot, leafHash), 'NFTPayoutClaim: Invalid proof.');

			claimed[merkleRoot][leafHash] = true;

			IERC1155(contractAddr).safeBatchTransferFrom(_distributorAddress, receiverAddress, tokenIds[i], amounts[i], "");
			emit ClaimPayout(_distributorAddress, receiverAddress, tokenIds[i], amounts[i]);
		}
	}
}
