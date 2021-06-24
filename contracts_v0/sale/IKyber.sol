pragma solidity =0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// https://github.com/KyberNetwork/smart-contracts/blob/master/contracts/KyberNetworkProxy.sol
interface IKyber {
    function getExpectedRate(
        ERC20 src,
        ERC20 dest,
        uint256 srcQty
    ) external view returns (uint256 expectedRate, uint256 slippageRate);

    function trade(
        ERC20 src,
        uint256 srcAmount,
        ERC20 dest,
        address destAddress,
        uint256 maxDestAmount,
        uint256 minConversionRate,
        address walletId
    ) external payable returns (uint256);
}
