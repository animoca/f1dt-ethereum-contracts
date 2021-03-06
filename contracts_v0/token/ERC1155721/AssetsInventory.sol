pragma solidity =0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./../ERC721/IERC721.sol";
import "./../ERC721/IERC721Metadata.sol";
import "./../ERC1155/IERC1155.sol";
import "./../ERC1155/IERC1155MetadataURI.sol";
import "./../ERC1155/IERC1155AssetCollections.sol";
import "./../ERC1155/IERC1155TokenReceiver.sol";

/**
    @title AssetsInventory, a contract which manages up to multiple collections of fungible and non-fungible tokens
    @dev In this implementation, with N representing the non-fungible bitmask length, IDs are composed as follow:
    (a) Fungible Collection IDs:
        - most significant bit == 0
    (b) Non-Fungible Collection IDs:
        - most significant bit == 1
        - (256-N) least significant bits == 0
    (c) Non-Fungible Token IDs:
        - most significant bit == 1
        - (256-N) least significant bits != 0

    If non-fungible bitmask length == 0, all the IDs represent a Fungible Collection.
    If non-fungible bitmask length == 1, there is one Non-Fungible Collection represented by the most significant bit set to 1 and other bits set to 0.
    If non-fungible bitmask length > 1, there are multiple Non-Fungible Collections.
 */
contract AssetsInventory is IERC165, IERC721, IERC1155, IERC1155AssetCollections, IERC721Metadata, IERC1155MetadataURI, Context {
    // id (collection) => owner => balance
    mapping(uint256 => mapping(address => uint256)) internal _balances;

    // owner => operator => approved
    mapping(address => mapping(address => bool)) internal _operatorApprovals;

    // id (nft) => operator
    mapping(uint256 => address) internal _tokenApprovals;

    // id (collection or nft) => owner
    mapping(uint256 => address) internal _owners;

    // owner => nb nfts owned
    mapping(address => uint256) internal _nftBalances;

    // Mask for the non-fungible flag in ids
    uint256 internal constant NF_BIT_MASK = 1 << 255;

    // Mask for non-fungible collection in ids (it includes the nf bit)
    uint256 internal NF_COLLECTION_MASK;

    /**
     * @dev Constructor function
     * @param nfMaskLength number of bits in the Non-Fungible Collection mask
     * if nfMaskLength == 0, the contract doesn't support non-fungible tokens
     * if nfMaskLength == 1, the single non-fungible collection which is represented by only the non-fungible bit set to 1
     * if nfMaskLength > 1, there are several
     */
    constructor(uint256 nfMaskLength) public {
        require(nfMaskLength < 256);
        if (nfMaskLength == 0) {
            NF_COLLECTION_MASK = 0;
        } else {
            uint256 mask = (1 << nfMaskLength) - 1;
            mask = mask << (256 - nfMaskLength);
            NF_COLLECTION_MASK = mask;
        }
    }

    /////////////////////////////////////////// ERC165 /////////////////////////////////////////////

    /**
     * @dev Check if support an interface id
     * @param interfaceId interface id to query
     * @return bool if support the given interface id
     */
    function supportsInterface(bytes4 interfaceId) public view returns (bool) {
        return (// ERC165 interface id
        interfaceId == 0x01ffc9a7 ||
            // ERC721 interface id
            interfaceId == 0x80ac58cd ||
            // ERC721Metadata interface id
            interfaceId == 0x5b5e139f ||
            // ERC721Exists interface id
            interfaceId == 0x4f558e79 ||
            // ERC1155 interface id
            interfaceId == 0xd9b67a26 ||
            // ERC1155AssetCollections interface id
            interfaceId == 0x09ce5c46 ||
            // ERC1155MetadataURI interface id
            interfaceId == 0x0e89341c);
    }

    /////////////////////////////////////////// ERC721 /////////////////////////////////////////////

    function balanceOf(address tokenOwner) public view returns (uint256) {
        require(tokenOwner != address(0x0));
        return _nftBalances[tokenOwner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        require(isNFT(tokenId));
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0x0));
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner); // solium-disable-line error-reason

        address sender = _msgSender();
        require(sender == tokenOwner || _operatorApprovals[tokenOwner][sender]); // solium-disable-line error-reason

        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(isNFT(tokenId) && exists(tokenId));
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address to, bool approved) public {
        address sender = _msgSender();
        require(to != sender);
        _setApprovalForAll(sender, to, approved);
    }

    function _setApprovalForAll(
        address sender,
        address operator,
        bool approved
    ) internal {
        _operatorApprovals[sender][operator] = approved;
        emit ApprovalForAll(sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        _transferFrom(from, to, tokenId, "", false);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        _transferFrom(from, to, tokenId, "", true);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public {
        _transferFrom(from, to, tokenId, data, true);
    }

    /////////////////////////////////////////// ERC1155 /////////////////////////////////////////////

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        require(to != address(0x0));

        address sender = _msgSender();
        bool operatable = (from == sender || _operatorApprovals[from][sender] == true);

        if (isFungible(id) && value > 0) {
            require(operatable);
            _transferFungible(from, to, id, value);
        } else if (isNFT(id) && value == 1) {
            _transferNonFungible(from, to, id, operatable);
            emit Transfer(from, to, id);
        } else {
            revert();
        }

        emit TransferSingle(sender, from, to, id, value);
        require(_checkERC1155AndCallSafeTransfer(sender, from, to, id, value, data, false, false));
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public {
        require(to != address(0x0));
        require(ids.length == values.length);

        // Only supporting a global operator approval allows to do a single check and not to touch storage to handle allowances.
        address sender = _msgSender();
        require(from == sender || _operatorApprovals[from][sender] == true);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 value = values[i];

            if (isFungible(id) && value > 0) {
                _transferFungible(from, to, id, value);
            } else if (isNFT(id) && value == 1) {
                _transferNonFungible(from, to, id, true);
                emit Transfer(from, to, id);
            } else {
                revert();
            }
        }

        emit TransferBatch(sender, from, to, ids, values);
        require(_checkERC1155AndCallSafeBatchTransfer(sender, from, to, ids, values, data));
    }

    function balanceOf(address tokenOwner, uint256 id) public view returns (uint256) {
        require(tokenOwner != address(0x0));

        if (isNFT(id)) {
            return _owners[id] == tokenOwner ? 1 : 0;
        }

        return _balances[id][tokenOwner];
    }

    function balanceOfBatch(address[] memory tokenOwners, uint256[] memory ids) public view returns (uint256[] memory) {
        require(tokenOwners.length == ids.length);

        uint256[] memory balances = new uint256[](tokenOwners.length);

        for (uint256 i = 0; i < tokenOwners.length; ++i) {
            require(tokenOwners[i] != address(0x0));

            uint256 id = ids[i];

            if (isNFT(id)) {
                balances[i] = _owners[id] == tokenOwners[i] ? 1 : 0;
            } else {
                balances[i] = _balances[id][tokenOwners[i]];
            }
        }

        return balances;
    }

    /////////////////////////////////////////// ERC1155AssetCollections /////////////////////////////////////////////

    function collectionOf(uint256 id) public view returns (uint256) {
        require(isNFT(id));
        return id & NF_COLLECTION_MASK;
    }

    /**
        @dev Tells whether an id represents a fungible collection
        @param id The ID to query
        @return bool whether the given id is fungible
     */
    function isFungible(uint256 id) public view returns (bool) {
        return id & (NF_BIT_MASK) == 0;
    }

    /**
        @dev Tells whether an id represents a non-fungible token
        @param id The ID to query
        @return bool whether the given id is non-fungible token
     */
    function isNFT(uint256 id) internal view returns (bool) {
        // A base type has the NF bit and an index
        return (id & (NF_BIT_MASK) != 0) && (id & (~NF_COLLECTION_MASK) != 0);
    }

    /**
     * @dev Returns whether the NFT belongs to someone
     * @param id uint256 ID of the NFT
     * @return whether the NFT belongs to someone
     */
    function exists(uint256 id) public view returns (bool) {
        address tokenOwner = _owners[id];
        return tokenOwner != address(0x0);
    }

    /////////////////////////////////////////// Transfer Internal Functions ///////////////////////////////////////

    /**
     * @dev Internal function to transfer the ownership of a given NFT to another address
     * Emits Transfer and TransferSingle events
     * Requires the msg sender to be the owner, approved, or operator
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
     * @param safe bool to indicate whether the transfer is safe
     */
    function _transferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data,
        bool safe
    ) internal {
        require(to != address(0x0));
        require(isNFT(tokenId));

        address sender = _msgSender();
        bool operatable = (from == sender || _operatorApprovals[from][sender] == true);

        _transferNonFungible(from, to, tokenId, operatable);

        emit Transfer(from, to, tokenId);
        emit TransferSingle(sender, from, to, tokenId, 1);

        require(_checkERC1155AndCallSafeTransfer(sender, from, to, tokenId, 1, data, true, safe));
    }

    /**
     * @dev Internal function to transfer the ownership of a given token ID to another address
     * Requires the msg sender to be the owner, approved, or operator
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param id uint256 ID of the token to be transferred
     * @param operatable bool to indicate whether the msg sender is operator
     */
    function _transferNonFungible(
        address from,
        address to,
        uint256 id,
        bool operatable
    ) internal {
        require(from == _owners[id]);

        address sender = _msgSender();
        require(operatable || ownerOf(id) == sender || getApproved(id) == sender);

        // clear approval
        if (_tokenApprovals[id] != address(0x0)) {
            _tokenApprovals[id] = address(0x0);
        }

        uint256 nfCollection = id & NF_COLLECTION_MASK;
        _balances[nfCollection][from] = SafeMath.sub(_balances[nfCollection][from], 1);
        _balances[nfCollection][to] = SafeMath.add(_balances[nfCollection][to], 1);

        _nftBalances[from] = SafeMath.sub(_nftBalances[from], 1);
        _nftBalances[to] = SafeMath.add(_nftBalances[to], 1);

        _owners[id] = to;
    }

    /**
     * @dev Internal function to move `collectionId` fungible tokens `value` from `from` to `to`.
     * @param from current owner of the `collectionId` fungible token
     * @param to address to receive the ownership of the given `collectionId` fungible token
     * @param collectionId uint256 ID of the fungible token to be transferred
     * @param value uint256 transfer amount
     */
    function _transferFungible(
        address from,
        address to,
        uint256 collectionId,
        uint256 value
    ) internal {
        _balances[collectionId][from] = SafeMath.sub(_balances[collectionId][from], value);
        _balances[collectionId][to] = SafeMath.add(_balances[collectionId][to], value);
    }

    /////////////////////////////////////////// Receiver Internal Functions ///////////////////////////////////////

    /**
     * @dev public function to invoke `onERC721Received` on a target address
     * The call is not executed if the target address is not a contract
     * @param operator transfer msg sender
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the token
     * @param tokenId uint256 ID of the token to be transferred
     * @param data bytes optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkERC721AndCallSafeTransfer(
        address operator,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal returns (bool) {
        if (!Address.isContract(to)) {
            return true;
        }
        return (IERC721Receiver(to).onERC721Received(operator, from, tokenId, data) == 0x150b7a02); // 0x150b7a02: ERC721 receive magic value
    }

    /**
     * @dev public function to invoke `onERC1155Received` on a target address
     * The call is not executed if the target address is not a contract
     * @param operator transfer msg sender
     * @param from address representing the previous owner of the given ID
     * @param to target address that will receive the token
     * @param id uint256 ID of the `non-fungible token / non-fungible collection / fungible collection` to be transferred
     * @param data bytes optional data to send along with the call
     * @param erc721 bool whether transfer to ERC721 contract
     * @param erc721Safe bool whether transfer to ERC721 contract safely
     * @return whether the call correctly returned the expected magic value
     */
    function _checkERC1155AndCallSafeTransfer(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data,
        bool erc721,
        bool erc721Safe
    ) internal returns (bool) {
        if (!Address.isContract(to)) {
            return true;
        }
        if (erc721) {
            if (!_checkIsERC1155Receiver(to)) {
                if (erc721Safe) {
                    return _checkERC721AndCallSafeTransfer(operator, from, to, id, data);
                } else {
                    return true;
                }
            }
        }
        return IERC1155TokenReceiver(to).onERC1155Received(operator, from, id, value, data) == 0xf23a6e61; // 0xf23a6e61: ERC1155 receive magic value
    }

    /**
     * @dev public function to invoke `onERC1155BatchReceived` on a target address
     * The call is not executed if the target address is not a contract
     * @param operator transfer msg sender
     * @param from address representing the previous owner of the given IDs
     * @param to target address that will receive the tokens
     * @param ids uint256 ID of the `non-fungible token / non-fungible collection / fungible collection` to be transferred
     * @param values uint256 transfer amounts of the `non-fungible token / non-fungible collection / fungible collection`
     * @param data bytes optional data to send along with the call
     * @return whether the call correctly returned the expected magic value
     */
    function _checkERC1155AndCallSafeBatchTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) internal returns (bool) {
        if (!Address.isContract(to)) {
            return true;
        }
        bytes4 retval = IERC1155TokenReceiver(to).onERC1155BatchReceived(operator, from, ids, values, data);
        return (retval == 0xbc197c81); // 0xbc197c81: ERC1155 batch receive magic value
    }

    /**
     * @dev public function to tell wheter a contract is ERC1155 Receiver contract
     * @param _contract address query contract addrss
     * @return wheter the given contract is ERC1155 Receiver contract
     */
    function _checkIsERC1155Receiver(address _contract) internal view returns (bool) {
        bytes4 erc1155ReceiverID = 0x4e2312e0;
        bytes4 INTERFACE_ID_ERC165 = 0x01ffc9a7;
        bool success;
        uint256 result;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            let x := mload(0x40) // Find empty storage location using "free memory pointer"
            mstore(x, INTERFACE_ID_ERC165) // Place signature at beginning of empty storage
            mstore(add(x, 0x04), erc1155ReceiverID) // Place first argument directly next to signature

            success := staticcall(
                10000, // 10k gas
                _contract, // To addr
                x, // Inputs are stored at location x
                0x24, // Inputs are 36 bytes long
                x, // Store output over input (saves space)
                0x20
            ) // Outputs are 32 bytes long

            result := mload(x) // Load the result
        }
        // (10000 / 63) "not enough for supportsInterface(...)" // consume all gas, so caller can potentially know that there was not enough gas
        assert(gasleft() > 158);
        return success && result == 1;
    }
}
