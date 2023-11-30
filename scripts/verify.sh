#!/bin/sh

HERE=$(dirname $(realpath $0))

PRESET_PATH=$HERE/input/presetAddresses.json
CONTRACT_PATH=$HERE/output/contractAddresses.json

BaobabNetwork='klaytn_baobab'

##### Preset #####

keeper=$(jq -r '.keeper' $PRESET_PATH)

##### Klaytn Baobab #####

TraderVault=$(jq -r '.Baobab.TraderVault' $CONTRACT_PATH)
Market=$(jq -r '.Baobab.Market' $CONTRACT_PATH)
TokenInfo=$(jq -r '.Baobab.TokenInfo' $CONTRACT_PATH)
RisePool=$(jq -r '.Baobab.RisePool' $CONTRACT_PATH)
ListingManager=$(jq -r '.Baobab.ListingManager' $CONTRACT_PATH)
GlobalState=$(jq -r '.Baobab.GlobalState' $CONTRACT_PATH)
PriceManager=$(jq -r '.Baobab.PriceManager' $CONTRACT_PATH)
PriceFetcher=$(jq -r '.Baobab.PriceFetcher' $CONTRACT_PATH)
Liquidation=$(jq -r '.Baobab.Liquidation' $CONTRACT_PATH)
Funding=$(jq -r '.Baobab.Funding' $CONTRACT_PATH)
PositionVault=$(jq -r '.Baobab.PositionVault' $CONTRACT_PATH)
OrderValidator=$(jq -r '.Baobab.OrderValidator' $CONTRACT_PATH)
OrderHistory=$(jq -r '.Baobab.OrderHistory' $CONTRACT_PATH)
PositionHistory=$(jq -r '.Baobab.PositionHistory' $CONTRACT_PATH)
PositionManager=$(jq -r '.Baobab.PositionManager' $CONTRACT_PATH)
MarketOrder=$(jq -r '.Baobab.MarketOrder' $CONTRACT_PATH)
OrderBook=$(jq -r '.Baobab.OrderBook' $CONTRACT_PATH)
OrderRouter=$(jq -r '.Baobab.OrderRouter' $CONTRACT_PATH)

npx hardhat verify --network $BaobabNetwork --contract contracts/account/TraderVault.sol:TraderVault $TraderVault
npx hardhat verify --network $BaobabNetwork --contract contracts/market/Market.sol:Market $Market
npx hardhat verify --network $BaobabNetwork --contract contracts/market/TokenInfo.sol:TokenInfo $TokenInfo "$Market"
npx hardhat verify --network $BaobabNetwork --contract contracts/risepool/RisePool.sol:RisePool $RisePool
npx hardhat verify --network $BaobabNetwork --contract contracts/market/ListingManager.sol:ListingManager $ListingManager
npx hardhat verify --network $BaobabNetwork --contract contracts/global/GlobalState.sol:GlobalState $GlobalState
npx hardhat verify --network $BaobabNetwork --contract contracts/price/PriceManager.sol:PriceManager $PriceManager "$GlobalState" "$TokenInfo"
npx hardhat verify --network $BaobabNetwork --contract contracts/price/PriceFetcher.sol:PriceFetcher $PriceFetcher "$PriceManager"
npx hardhat verify --network $BaobabNetwork --contract contracts/liquidation/Liquidation.sol:Liquidation $Liquidation "$PriceManager" "$TraderVault" "$TokenInfo" "$Market"
npx hardhat verify --network $BaobabNetwork --contract contracts/fee/Funding.sol:Funding $Funding "$PriceFetcher" "$GlobalState" "$TokenInfo" "$Market"
npx hardhat verify --network $BaobabNetwork --contract contracts/position/PositionVault.sol:PositionVault $PositionVault "$Funding"
npx hardhat verify --network $BaobabNetwork --contract contracts/order/OrderValidator.sol:OrderValidator $OrderValidator "$PositionVault" "$GlobalState" "$RisePool"
npx hardhat verify --network $BaobabNetwork --contract contracts/order/OrderHistory.sol:OrderHistory $OrderHistory "$TraderVault"
npx hardhat verify --network $BaobabNetwork --contract contracts/position/PositionHistory.sol:PositionHistory $PositionHistory "$PositionVault" "$TraderVault"
npx hardhat verify --network $BaobabNetwork --contract contracts/position/PositionManager.sol:PositionManager $PositionManager "$PositionVault" "$Market"
npx hardhat verify --network $BaobabNetwork --contract contracts/order/MarketOrder.sol:MarketOrder $MarketOrder "$TraderVault" "$RisePool" "$Market" "$PositionHistory" "$PositionVault" "$OrderValidator" "$OrderHistory" "$GlobalState"
npx hardhat verify --network $BaobabNetwork --contract contracts/orderbook/OrderBook.sol:OrderBook $OrderBook "$TraderVault" "$RisePool" "$Market" "$PositionHistory" "$PositionVault"
npx hardhat verify --network $BaobabNetwork --contract contracts/order/OrderRouter.sol:OrderRouter $OrderRouter "$MarketOrder" "$OrderBook"