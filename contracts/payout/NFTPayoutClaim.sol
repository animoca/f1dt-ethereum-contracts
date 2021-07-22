// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.8;
pragma experimental ABIEncoderV2;

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/token/ERC1155/IERC1155.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/cryptography/MerkleProof.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract NFTPayoutClaim is Ownable {
    using MerkleProof for bytes32[];

    event SetDistributor(address indexed _address, address indexed _distributorAddress);
    event SetMerkleRoot(address indexed _address, bytes32 _merkleRoot);
    event ClaimPayout(address indexed _fromAddress, address indexed _toAddress, uint256[] _tokenId, uint256[] _amount);
    event SetMerkleRootStatus(bytes32 _merkleRoot, bool _status);

    address public _distributorAddress;

    uint256 merkleRootCount;
    mapping(bytes32 => mapping(bytes32 => bool)) private claimed; // merkleRoot -> (hash, claimed)
    mapping(bytes32 => bool) public merkleRoots; // merkleRoot -> enabled
    mapping(bytes32 => bool) public merkleRootExists; // merkleRoot -> exists (optional - for validation)

    constructor() public {

    }

    function setDistributor(address distributorAddress) external onlyOwner {
        _distributorAddress = distributorAddress;
        emit SetDistributor(msg.sender, _distributorAddress);
    }

    function addMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        uint256 count = merkleRootCount;
        merkleRootCount = count + 1;

        merkleRoots[_merkleRoot] = true;
        merkleRootExists[_merkleRoot] = true;

        emit SetMerkleRoot(msg.sender, _merkleRoot);
    }

    function disableMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoots[_merkleRoot] = false;
        emit SetMerkleRootStatus(_merkleRoot, false);
    }

    function claimPayout(
        uint256[] calldata _index,
        bytes32 batch,
        address[] calldata _contractAddress,
        uint256[][] calldata _tokenIds,
        uint256[][] calldata _amounts,
        bytes32 _merkleRoot,
        bytes32[][] calldata _merkleProof
    ) external {
        require(merkleRootExists[_merkleRoot], 'NFTPayoutClaim: Invalid MerkleRoot');
        require(merkleRoots[_merkleRoot], 'NFTPayoutClaim: MerkleRoot not enabled.');

        uint i;
        for (i = 0; i < _contractAddress.length; i++) {
            address contractAddr = _contractAddress[i];

            bytes32 leafHash = keccak256(abi.encodePacked(_index[i], batch, msg.sender, contractAddr, _tokenIds[i], _amounts[i]));

            require(!claimed[_merkleRoot][leafHash], "NFTPayoutClaim: Payout already claimed");
            require(_merkleProof[i].verify(_merkleRoot, leafHash), 'NFTPayoutClaim: Invalid proof.');

            claimed[_merkleRoot][leafHash] = true;

            IERC1155(contractAddr).safeBatchTransferFrom(_distributorAddress, msg.sender, _tokenIds[i], _amounts[i], "");
            emit ClaimPayout(_distributorAddress, msg.sender, _tokenIds[i], _amounts[i]);
        }
    }
}
