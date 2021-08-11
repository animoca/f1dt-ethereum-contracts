// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.8.0;
pragma experimental ABIEncoderV2;

import {MerkleProof} from "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import {Ownable} from "@animoca/ethereum-contracts-core/contracts/access/Ownable.sol";
import {IERC1155} from "@animoca/ethereum-contracts-assets/contracts/token/ERC1155/IERC1155.sol";

contract NFTPayoutClaim is Ownable {
    using MerkleProof for bytes32[];

    event SetDistributor(address indexed account, address indexed distributorAddress);
    event SetMerkleRoot(address indexed account, bytes32 merkleRoot);
    event ClaimPayout(address indexed fromAddress, address indexed toAddress, uint256[] tokenId, uint256[] amount);
    event SetMerkleRootStatus(bytes32 merkleRoot, bool status);

    address public distributorAddress;

    uint256 public merkleRootCount = 0;
    mapping(bytes32 => mapping(bytes32 => bool)) public claimed; // merkleRoot -> (hash, claimed)
    mapping(bytes32 => bool) public merkleRoots; // merkleRoot -> enabled
    mapping(bytes32 => bool) public merkleRootExists; // merkleRoot -> exists (optional - for validation)

    constructor() Ownable(msg.sender) {
        distributorAddress = msg.sender;
    }

    function setDistributor(address distAddress) external {
        _requireOwnership(_msgSender());
        distributorAddress = distAddress;
        emit SetDistributor(_msgSender(), distAddress);
    }

    function addMerkleRoot(bytes32 merkleRoot) external {
        _requireOwnership(_msgSender());
        require(merkleRootExists[merkleRoot] == false, "MerkleRoot already exists.");

        uint256 count = merkleRootCount;
        merkleRootCount = count + 1;

        merkleRoots[merkleRoot] = true;
        merkleRootExists[merkleRoot] = true;

        emit SetMerkleRoot(_msgSender(), merkleRoot);
    }

    function disableMerkleRoot(bytes32 merkleRoot) external {
        _requireOwnership(_msgSender());
        require(merkleRootExists[merkleRoot] == true, "Invalid MerkleRoot.");
        require(merkleRoots[merkleRoot] == true, "MerkleRoot disabled.");

        merkleRoots[merkleRoot] = false;
        emit SetMerkleRootStatus(merkleRoot, false);
    }

    function claimPayout(
        uint256 batch,
        address receiver,
        address[] calldata contractAddress,
        uint256[][] calldata tokenIds,
        uint256[][] calldata amounts,
        bytes32 merkleRoot,
        bytes32[][] calldata merkleProof
    ) external {
        require(merkleRootExists[merkleRoot] == true, "Invalid MerkleRoot.");
        require(merkleRoots[merkleRoot] == true, "MerkleRoot disabled.");

        uint256 i;
        for (i = 0; i < contractAddress.length; i++) {
            address contractAddr = contractAddress[i];

            bytes32 leafHash = keccak256(abi.encodePacked(batch, receiver, contractAddr, tokenIds[i], amounts[i]));

            require(!claimed[merkleRoot][leafHash], "Payout already claimed.");
            require(merkleProof[i].verify(merkleRoot, leafHash), "Invalid proof.");

            claimed[merkleRoot][leafHash] = true;

            IERC1155(contractAddr).safeBatchTransferFrom(distributorAddress, receiver, tokenIds[i], amounts[i], "");
            emit ClaimPayout(distributorAddress, receiver, tokenIds[i], amounts[i]);
        }
    }
}
