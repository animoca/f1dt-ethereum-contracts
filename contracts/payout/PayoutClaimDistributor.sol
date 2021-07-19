// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.6 <0.8.0;

import {MerkleProof} from "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import {Ownable} from "@animoca/ethereum-contracts-core/contracts/access/Ownable.sol";
import {IERC20} from "@animoca/ethereum-contracts-assets/contracts/token/ERC20/IERC20.sol";
import {ERC20Wrapper, IWrappedERC20} from "@animoca/ethereum-contracts-core/contracts/utils/ERC20Wrapper.sol";

/// @title PayoutClaimDistributor
contract PayoutClaimDistributor is Ownable {
    using MerkleProof for bytes32[];
    using ERC20Wrapper for IWrappedERC20;

    event SetMerkleRoot(bytes32 indexed _merkleRoot);
    event ClaimedPayout(address indexed _address, uint256 amount, bytes32 salt);
    event DistributionLocked(bool _isLocked);
    event SetDistributorAddress(address indexed _ownerAddress, address indexed _distAddress);

    bytes32 public merkleRoot;
    IWrappedERC20 public token;
    address public distAddress;
    bool public isLocked;

    /*
     * Mapping for hash for (index,  address, amount, salt) for claimed status
     */
    mapping(bytes32 => bool) public claimed;

    /// @dev Constructor for setting ERC token address on deployment
    /// @param token_ Address for token to distribute
    /// @dev `distAddress` deployer address will be distributor address by default
    constructor(IWrappedERC20 token_) Ownable(msg.sender) {
        token = token_;
        distAddress = msg.sender;
    }

    /// @notice Merkle Root for current period to use for payout
    /// @dev Owner sets merkle hash generated based on the payout set
    /// @param merkleRoot_ bytes32 string of merkle root to set for specific period
    function setMerkleRoot(bytes32 merkleRoot_) public {
        _requireOwnership(_msgSender());
        merkleRoot = merkleRoot_;
        emit SetMerkleRoot(merkleRoot_);
    }

    /// @notice Set locked/unlocked status  for PayoutClaim Distributor
    /// @dev Owner lock/unlock each time new merkle root is being generated
    /// @param isLocked_ = true/false status
    function setLocked(bool isLocked_) public {
        _requireOwnership(_msgSender());
        isLocked = isLocked_;
        emit DistributionLocked(isLocked_);
    }

    /// @notice Distributor address in PayoutClaim Distributor
    /// @dev Wallet that holds token for distribution
    /// @param distributorAddress_ Distributor address used for distribution of `token` token
    function setDistributorAddress(address distributorAddress_) public {
        _requireOwnership(_msgSender());
        distAddress = distributorAddress_;
        emit SetDistributorAddress(msg.sender, distributorAddress_);
    }

    /// @notice Payout method that user calls to claim
    /// @dev Method user calls for claiming the payout for user
    /// @param index Index assigned for the address for the merkle root
    /// @param address_ Address of the user to claim the payout
    /// @param amount Claimable amount of address
    /// @param salt Unique value for user for each new merkle root generating
    /// @param merkleProof Merkle proof of the user based on the merkle root
    function claimPayout(
        uint256 index,
        address address_,
        uint256 amount,
        bytes32 salt,
        bytes32[] calldata merkleProof
    ) external {
        require(!isLocked, "Payout locked");
        require(amount != 0, "Invalid Amount");

        bytes32 leafHash = keccak256(abi.encodePacked(index, address_, amount, salt));

        require(!claimed[leafHash], "Payout already claimed");
        require(merkleProof.verify(merkleRoot, leafHash), "Invalid proof");

        claimed[leafHash] = true;

        require(token.transferFrom(distAddress, address_, amount), "Payout failed");

        emit ClaimedPayout(address_, amount, salt);
    }
}
