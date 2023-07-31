// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "hardhat/console.sol"; // test-only
import "../crosschain/interfaces/l3/ArbSys.sol";
import "../position/PositionVault.sol";
import "../risepool/RisePool.sol";

// TODO: check - `override` needed for function declared in the interface `IL3Vault`?
contract TraderVault {
    PositionVault public positionVault;
    RisePool public risePool;

    mapping(address => mapping(uint256 => uint256)) public traderBalances; // userAddress => assetId => Balance
    mapping(address => uint256) public traderFilledOrderCounts; // userAddress => orderCount
    mapping(address => bool) public isIsolated; // trader's margin mode

    function changeMarginMode() public {
        // TODO: allowed to change the margin mode only when there is no open position for the trader
        isIsolated[msg.sender] = !isIsolated[msg.sender];
    }

    // from DA server (or from EVM storage)
    function getTraderOpenPositionKeys() public {}

    // Liquidation => UnrealizedPnL, Maintenance Margin의 총합만 있으면 됨
    // function getTraderUnrealizedPnL() public {}
    // function getTraderMaintenanceMargin() public {}
    // trader open positions
    // trader open orders
    // trader order history
    // trader trade history
    // trader position history
    // trader balance
    // trader unrealized PnL (by position / total)
    // trader margin balance
    // trader maintenance margin
    // trader avbl margin

    // TODO: onlyManager
    function increaseTraderBalance(
        address _trader,
        uint256 _assetId,
        uint256 _amount
    ) external {
        traderBalances[_trader][_assetId] += _amount;
    }

    // TODO: onlyManager
    function decreaseTraderBalance(
        address _trader,
        uint256 _assetId,
        uint256 _amount
    ) external {
        traderBalances[_trader][_assetId] -= _amount;
    }

    function getTraderBalance(
        address _trader,
        uint256 _assetId
    ) external view returns (uint256) {
        return traderBalances[_trader][_assetId];
    }

    // onlyOrderHistory
    function getTraderFilledOrderCount(
        address _trader
    ) external view returns (uint256) {
        return traderFilledOrderCounts[_trader];
    }

    // onlyOrderHistory
    function setTraderFilledOrderCount(
        address _trader,
        uint256 _count
    ) external {
        traderFilledOrderCounts[_trader] = _count;
    }
}
