// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

import "@animoca/ethereum-contracts-sale_base-6/contracts/sale/FixedPricesSale.sol";

/**
 * @title CrateKeyFullSale
 * A FixedPricesSale contract implementation that handles the full-price (non-discounted) purchase of ERC20 F1DTCrateKey tokens.
 */
contract CrateKeyFullSale is FixedPricesSale {

    /* sku => crate key */
    mapping (bytes32 => IF1DTCrateKeyFull) public crateKeys;

    /**
     * Constructor.
     * @dev Emits the `MagicValues` event.
     * @dev Emits the `Paused` event.
     * @dev Emits the `PayoutWalletSet` event.
     * @param payoutWallet_ the payout wallet.
     */
    constructor (
        address payoutWallet_
    )
        public
        FixedPricesSale(
            payoutWallet_,
            4,  // SKUs capacity (each type of crate key only)
            4   // tokens per-SKU capacity
        )
    {
    }

    /**
     * Creates an SKU.
     * @dev Deprecated. Please use `createCrateKeySku(bytes32, uint256, uint256, IF1DTCrateKeyFull)` for creating
     *  inventory SKUs.
     * @dev Reverts if called.
     * @param *sku* the SKU identifier.
     * @param *totalSupply* the initial total supply.
     * @param *maxQuantityPerPurchase* The maximum allowed quantity for a single purchase.
     * @param *notificationsReceiver* The purchase notifications receiver contract address.
     *  If set to the zero address, the notification is not enabled.
     */
    function createSku(
        bytes32 /*sku*/,
        uint256 /*totalSupply*/,
        uint256 /*maxQuantityPerPurchase*/,
        address /*notificationsReceiver*/
    ) public override onlyOwner {
        revert("Deprecated. Please use `createCrateKeySku(bytes32, uint256, uint256, IF1DTCrateKeyFull)`");
    }

    /**
     * Creates an SKU and associates the specified ERC20 F1DTCrateKey token contract with it.
     * @dev Reverts if called by any other than the contract owner.
     * @dev Reverts if `totalSupply` is zero.
     * @dev Reverts if `sku` already exists.
     * @dev Reverts if the update results in too many SKUs.
     * @dev Reverts if the `totalSupply` is SUPPLY_UNLIMITED.
     * @dev Reverts if the `crateKey` is the zero address.
     * @dev Emits the `SkuCreation` event.
     * @param sku The SKU identifier.
     * @param totalSupply The initial total supply.
     * @param maxQuantityPerPurchase The maximum allowed quantity for a single purchase.
     * @param crateKey The ERC20 F1DTCrateKey token contract to bind with the SKU.
     */
    function createCrateKeySku(
        bytes32 sku,
        uint256 totalSupply,
        uint256 maxQuantityPerPurchase,
        IF1DTCrateKeyFull crateKey
    ) external onlyOwner {
        require(
            totalSupply != SUPPLY_UNLIMITED,
            "CrateKeyFullSale: invalid total supply");
        
        require(
            crateKey != IF1DTCrateKeyFull(0),
            "CrateKeyFullSale: zero address");

        super.createSku(
            sku,
            totalSupply,
            maxQuantityPerPurchase,
            address(0));    // notifications receiver

        crateKeys[sku] = crateKey;
    }

    /**
     * Lifecycle step which delivers the purchased SKUs to the recipient.
     * @dev Responsibilities:
     *  - Ensure the product is delivered to the recipient, if that is the contract's responsibility.
     *  - Handle any internal logic related to the delivery, including the remaining supply update;
     *  - Add any relevant extra data related to delivery in `purchase.deliveryData` and document how to interpret it.
     * @dev Transfers tokens from the ERC20 F1DTCrateKey token contract associated with the SKU being purchased, of the
     *  specified purchase quantity.
     * @dev Reverts if the holder has an insufficient ERC20 F1DTCrateKey token balance for the transfer.
     * @dev Reverts if the sale contract has an insufficient ERC20 F1DTCrateKey allowance for the transfer.
     * @param purchase The purchase conditions.
     */
    function _delivery(
        PurchaseData memory purchase
    ) internal override {
        super._delivery(purchase);

        IF1DTCrateKeyFull crateKey = crateKeys[purchase.sku];

        crateKey.transferFrom(
            crateKey.holder(),
            purchase.recipient,
            purchase.quantity);
    }

}

/**
 * @dev Interface of the ERC20 F1DTCrateKey token contract.
 */
interface IF1DTCrateKeyFull {

    /**
     * Returns the amount of tokens owned by `account`.
     * @param account The account whose token balance will be retrieved.
     * @return The amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through
     *  {transferFrom}.
     * @dev This value is zero by default.
     * @dev This value changes when {approve} or {transferFrom} are called.
     * @param owner The account who has granted a spending allowance to the spender.
     * @param spender The account who has been granted a spending allowance by the owner.
     * @return The remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through
     *  {transferFrom}.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * Moves `amount` tokens from `sender` to `recipient` using the allowance mechanism. 
     * @dev `amount` is deducted from the caller's allowance.
     * @dev Emits a {Transfer} event.
     * @param sender The account where the tokens will be transferred from.
     * @param recipient The account where the tokens will be transferred to.
     * @param amount The amount of tokens being transferred.
     * @return Boolean indicating whether the operation succeeded.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * Returns the account holding the initial token supply.
     * @return The account holding the initial token supply.
     */
    function holder() external view returns (address);
}
