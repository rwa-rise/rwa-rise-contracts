// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../common/constants.sol";
import "../common/enums.sol";

import "../account/TraderVault.sol";

contract PositionFee {
    TraderVault public traderVault;

    uint256 public constant MARKET_POSITION_FEE_MULTIPLIER = 5; // 0.05%
    uint256 public constant LIMIT_POSITION_FEE_MULTIPLIER = 5; // 0.05%
    uint256 public constant POSITION_FEE_PRECISION = 1e4;
    uint256 public collectedPositionFees = 0;

    // TODO : POSITION_FEE_CONSTANT , POSITION_FEE_PRECISION 값 확인 필요

    constructor(address _traderVault) {
        traderVault = TraderVault(_traderVault);
    }

    function getPositionFee(
        uint256 _sizeAbsInUsd,
        OrderType _orderType
    ) public pure returns (uint256) {
        uint256 feeMultiplier = (_orderType == OrderType.Market ||
            _orderType == OrderType.StopMarket)
            ? MARKET_POSITION_FEE_MULTIPLIER
            : LIMIT_POSITION_FEE_MULTIPLIER;
        return (feeMultiplier * _sizeAbsInUsd) / POSITION_FEE_PRECISION;
    }

    function payPositionFee(
        address _trader,
        uint256 _sizeAbs,
        uint256 _avgExecPrice,
        uint256 _feeAssetId,
        OrderType _orderType
    ) external {
        uint256 sizeAbsInUsd = (_sizeAbs * _avgExecPrice) /
            TOKEN_SIZE_PRECISION;
        uint256 fee = getPositionFee(sizeAbsInUsd, _orderType);
        uint256 traderMarginBalance = traderVault.getTraderBalance(
            _trader,
            _feeAssetId
        );
        require(
            traderMarginBalance > fee,
            "PositionFee: insufficient margin balance"
        ); // TODO: add condition checks for maintenance margin
        traderVault.decreaseTraderBalance(_trader, _feeAssetId, fee);
        collectedPositionFees += fee; // TODO: collecting fee from L2Vault (and distributing to $RM, $RISE holders)
    }
}
