// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../common/Context.sol";
import "../risepool/RisePool.sol";
import "../account/TraderVault.sol";
import "../position/PositionVault.sol";

contract OrderUtils is Context {
    RisePool public risePool;
    TraderVault public traderVault;
    PositionVault public positionVault;

    function settlePnL(
        bytes32 _key,
        bool _isLong,
        uint256 _markPrice,
        uint256 _indexAssetId,
        uint256 _marginAssetId,
        uint256 _sizeAbsInUsd,
        uint256 _marginAbsInUsd
    ) external {
        // Position memory position = positions[_key];
        Position memory position = positionVault.getPosition(_key);
        (uint256 pnlUsdAbs, bool traderHasProfit) = _calculatePnL(
            position.sizeInUsd,
            position.avgOpenPrice,
            _markPrice,
            _isLong
        );

        traderVault.increaseTraderBalance(
            msg.sender,
            _marginAssetId,
            _marginAbsInUsd
        ); // TODO: check - is it `msg.sender`?

        if (traderHasProfit) {
            traderVault.increaseTraderBalance(
                msg.sender,
                _marginAssetId,
                pnlUsdAbs
            );
            risePool.decreasePoolAmounts(USD_ID, pnlUsdAbs); // TODO: check - USD or token?
        } else {
            traderVault.decreaseTraderBalance(
                msg.sender,
                _marginAssetId,
                pnlUsdAbs
            );
            risePool.increasePoolAmounts(USD_ID, pnlUsdAbs);
        }
        // TODO: check - PnL includes margin?

        risePool.decreaseReserveAmounts(_indexAssetId, _sizeAbsInUsd);
    }
}
