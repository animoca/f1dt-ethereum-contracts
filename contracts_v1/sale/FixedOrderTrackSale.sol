// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

import "@animoca/ethereum-contracts-sale_base/contracts/sale/FixedOrderInventorySale.sol";

/**
 * @title FixedOrderTrackSale
 * A FixedOrderInventorySale contract implementation that handles the purchases of F1® DeltaTime
 * track NFTs by minting them from an inventory contract to the recipient. The provisioning of the
 * NFTs from the holder account occurs in a sequential order defined by a token list. Only a
 * single SKU is supported.
 */
contract FixedOrderTrackSale is FixedOrderInventorySale {

    /**
     * Constructor.
     * @dev Reverts if `inventory` is the zero address.
     * @dev Emits the `MagicValues` event.
     * @dev Emits the `Paused` event.
     * @param inventory The inventory contract from which the NFT sale supply is attributed from.
     * @param payoutWallet The payout wallet.
     * @param tokensPerSkuCapacity the cap for the number of tokens managed per SKU.
     */
    constructor(
        address inventory,
        address payoutWallet,
        uint256 tokensPerSkuCapacity
    )
        public
        FixedOrderInventorySale(
            inventory,
            payoutWallet,
            tokensPerSkuCapacity)
    {}

    /**
     * Creates an SKU.
     * @dev Reverts if called by any other than the contract owner.
     * @dev Reverts if called when the contract is not paused.
     * @dev Reverts if the initial sale supply is empty.
     * @dev Reverts if `sku` already exists.
     * @dev Reverts if `notificationsReceiver` is not the zero address and is not a contract address.
     * @dev Reverts if the update results in too many SKUs.
     * @dev Emits the `SkuCreation` event.
     * @param sku the SKU identifier.
     * @param maxQuantityPerPurchase The maximum allowed quantity for a single purchase.
     * @param notificationsReceiver The purchase notifications receiver contract address.
     *  If set to the zero address, the notification is not enabled.
     */
    function createSku(
        bytes32 sku,
        uint256 maxQuantityPerPurchase,
        address notificationsReceiver
    ) external onlyOwner whenPaused {
        _createSku(sku, tokenList.length, maxQuantityPerPurchase, notificationsReceiver);
    }

    /**
     * Lifecycle step which delivers the purchased SKUs to the recipient.
     * @dev Responsibilities:
     *  - Ensure the product is delivered to the recipient, if that is the contract's responsibility.
     *  - Handle any internal logic related to the delivery, including the remaining supply update.
     *  - Add any relevant extra data related to delivery in `purchase.deliveryData` and document how to interpret it.
     * @dev Reverts if there is not enough available supply.
     * @dev Reverts if this contract does not have the minter role on the inventory contract.
     * @dev Updates `purchase.deliveryData` with the list of tokens allocated from `tokenList` for
     *  this purchase.
     * @dev Mints the tokens allocated in `purchase.deliveryData` to the purchase recipient.
     * @param purchase The purchase conditions.
     */
    function _delivery(PurchaseData memory purchase) internal virtual override {
        super._delivery(purchase);

        address[] memory to = new address[](purchase.quantity);
        uint256[] memory ids = new uint256[](purchase.quantity);
        bytes32[] memory uris = new bytes32[](purchase.quantity);
        uint256[] memory values = new uint256[](purchase.quantity);

        IFixedOrderInventoryMintable mintableInventory =
            IFixedOrderInventoryMintable(inventory);

        for (uint256 index = 0; index != purchase.quantity; ++index) {
            to[index] = purchase.recipient;
            ids[index] = uint256(purchase.deliveryData[index]);
            uris[index] = "";
            values[index] = 1;
        }

        mintableInventory.batchMint(
            to,
            ids,
            uris,
            values,
            false);
    }

}

/**
 * @dev Interface for the mint function of the NFT inventory contract.
 */
interface IFixedOrderInventoryMintable {

    /*
     * Mints a batch of new tokens.
     * @dev Reverts if some the given token IDs already exist.
     * @param to address[] List of addresses that will own the minted tokens.
     * @param ids uint256[] List of ids of the tokens to be minted.
     * @param uris bytes32[] Concatenated metadata URIs of nfts to be minted.
     * @param values uint256[] List of quantities of ft to be minted.
     */
    function batchMint(
        address[] calldata to,
        uint256[] calldata ids,
        bytes32[] calldata uris,
        uint256[] calldata values,
        bool safe
    ) external;

}
