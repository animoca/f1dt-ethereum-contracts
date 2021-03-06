pragma solidity =0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
    @title ERC20Fees
    @dev a GSNRecipient contract with support for ERC-20 fees
    Note: .
 */
contract ERC20Fees is GSNRecipient, Ownable {
    enum ErrorCodes {INSUFFICIENT_BALANCE}

    IERC20 public _gasToken;
    address public _payoutWallet;
    uint256 public _gasPriceScaling = GAS_PRICE_SCALING_SCALE;

    uint256 internal constant GAS_PRICE_SCALING_SCALE = 1000;

    /**
     * @dev Constructor function
     */
    constructor(address gasTokenAddress, address payoutWallet) internal {
        setGasToken(gasTokenAddress);
        setPayoutWallet(payoutWallet);
    }

    function setGasToken(address gasTokenAddress) public onlyOwner {
        _gasToken = IERC20(gasTokenAddress);
    }

    function setPayoutWallet(address payoutWallet) public onlyOwner {
        require(payoutWallet != address(this));
        _payoutWallet = payoutWallet;
    }

    function setGasPrice(uint256 gasPriceScaling) public onlyOwner {
        _gasPriceScaling = gasPriceScaling;
    }

    /**
     * @dev Withdraws the recipient's deposits in `RelayHub`.
     */
    function withdrawDeposits(uint256 amount, address payable payee) external onlyOwner {
        _withdrawDeposits(amount, payee);
    }

    /////////////////////////////////////////// GSNRecipient ///////////////////////////////////
    /**
     * @dev Ensures that only users with enough gas payment token balance can have transactions relayed through the GSN.
     */
    function acceptRelayedCall(
        address,
        address from,
        bytes memory,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256,
        uint256,
        bytes memory,
        uint256 maxPossibleCharge
    ) public view returns (uint256, bytes memory) {
        if (_gasToken.balanceOf(from) < ((maxPossibleCharge * _gasPriceScaling) / GAS_PRICE_SCALING_SCALE)) {
            return _rejectRelayedCall(uint256(ErrorCodes.INSUFFICIENT_BALANCE));
        }

        return _approveRelayedCall(abi.encode(from, maxPossibleCharge, transactionFee, gasPrice));
    }

    /**
     * @dev Implements the precharge to the user. The maximum possible charge (depending on gas limit, gas price, and
     * fee) will be deducted from the user balance of gas payment token. Note that this is an overestimation of the
     * actual charge, necessary because we cannot predict how much gas the execution will actually need. The remainder
     * is returned to the user in {_postRelayedCall}.
     */
    function _preRelayedCall(bytes memory context) internal returns (bytes32) {
        (address from, uint256 maxPossibleCharge) = abi.decode(context, (address, uint256));

        // The maximum token charge is pre-charged from the user
        require(_gasToken.transferFrom(from, _payoutWallet, (maxPossibleCharge * _gasPriceScaling) / GAS_PRICE_SCALING_SCALE));
    }

    /**
     * @dev Returns to the user the extra amount that was previously charged, once the actual execution cost is known.
     */
    function _postRelayedCall(
        bytes memory context,
        bool,
        uint256 actualCharge,
        bytes32
    ) internal {
        (address from, uint256 maxPossibleCharge, uint256 transactionFee, uint256 gasPrice) =
            abi.decode(context, (address, uint256, uint256, uint256));

        // actualCharge is an _estimated_ charge, which assumes postRelayedCall will use all available gas.
        // This implementation's gas cost can be roughly estimated as 10k gas, for the two SSTORE operations in an
        // ERC20 transfer.
        uint256 overestimation = _computeCharge(SafeMath.sub(POST_RELAYED_CALL_MAX_GAS, 10000), gasPrice, transactionFee);
        actualCharge = SafeMath.sub(actualCharge, overestimation);

        // After the relayed call has been executed and the actual charge estimated, the excess pre-charge is returned
        require(
            _gasToken.transferFrom(_payoutWallet, from, (SafeMath.sub(maxPossibleCharge, actualCharge) * _gasPriceScaling) / GAS_PRICE_SCALING_SCALE)
        );
    }
}
