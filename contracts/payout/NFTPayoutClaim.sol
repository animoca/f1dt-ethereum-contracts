// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.8.0;
pragma experimental ABIEncoderV2;

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/token/ERC1155/IERC1155.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/cryptography/MerkleProof.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0/contracts/access/Ownable.sol";
//import {MerkleProof} from "@openzeppelin/contracts/cryptography/MerkleProof.sol";
//import {Ownable} from "@animoca/ethereum-contracts-core/contracts/access/Ownable.sol";
//import {IERC20} from "@animoca/ethereum-contracts-assets/contracts/token/ERC1155/IERC1155.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTPayoutClaim is Ownable {
    using MerkleProof for bytes32[];

    event SetDistributor(address indexed _address, address indexed _distributorAddress);
    event SetMerkleRoot(address indexed _address, bytes32 _merkleRoot);
    event ClaimPayout(address indexed _fromAddress, address indexed _toAddress, uint256[] _tokenId, uint256[] _amount);
    event SetMerkleRootStatus(bytes32 _merkleRoot, bool _status);

    address public _distributorAddress;

    uint256 public merkleRootCount = 0;
    mapping(bytes32 => mapping(bytes32 => bool)) public claimed; // merkleRoot -> (hash, claimed)
    mapping(bytes32 => bool) public merkleRoots; // merkleRoot -> enabled
    mapping(bytes32 => bool) public merkleRootExists; // merkleRoot -> exists (optional - for validation)

    constructor() {
        _distributorAddress = msg.sender;
    }

    function setDistributor(address distributorAddress) external onlyOwner {
        _distributorAddress = distributorAddress;
        emit SetDistributor(msg.sender, _distributorAddress);
    }

    function addMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        require(merkleRootExists[_merkleRoot] == false, "MerkleRoot already exists.");

        uint256 count = merkleRootCount;
        merkleRootCount = count + 1;

        merkleRoots[_merkleRoot] = true;
        merkleRootExists[_merkleRoot] = true;

        emit SetMerkleRoot(msg.sender, _merkleRoot);
    }

    function disableMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        require(merkleRootExists[_merkleRoot] == true, "Invalid MerkleRoot.");
        require(merkleRoots[_merkleRoot] == true, "MerkleRoot disabled.");

        merkleRoots[_merkleRoot] = false;
        emit SetMerkleRootStatus(_merkleRoot, false);
    }

    function claimPayout(
        uint256 _batch,
        address _receiver,
        address[] calldata _contractAddress,
        uint256[][] calldata _tokenIds,
        uint256[][] calldata _amounts,
        bytes32 _merkleRoot,
        bytes32[][] calldata _merkleProof
    ) external {
        require(merkleRootExists[_merkleRoot] == true, "Invalid MerkleRoot.");
        require(merkleRoots[_merkleRoot] == true, "MerkleRoot disabled.");

        uint256 i;
        for (i = 0; i < _contractAddress.length; i++) {
            address contractAddr = _contractAddress[i];

            bytes32 leafHash = keccak256(abi.encodePacked(_batch, _receiver, contractAddr, _tokenIds[i], _amounts[i]));

            require(!claimed[_merkleRoot][leafHash], "Payout already claimed.");
            require(_merkleProof[i].verify(_merkleRoot, leafHash), "Invalid proof.");

            claimed[_merkleRoot][leafHash] = true;

            IERC1155(contractAddr).safeBatchTransferFrom(_distributorAddress, _receiver, _tokenIds[i], _amounts[i], "");
            emit ClaimPayout(_distributorAddress, _receiver, _tokenIds[i], _amounts[i]);
        }
    }
}
