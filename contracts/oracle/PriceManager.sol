// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../common/constants.sol";

import "../orderbook/OrderBook.sol";
import "../market/TokenInfo.sol";
import "../global/GlobalState.sol";

import "hardhat/console.sol";

contract PriceManager {
    using SafeCast for int256;
    using SafeCast for uint256;

    OrderBook public orderBook;
    TokenInfo public tokenInfo;
    GlobalState public globalState;

    mapping(address => bool) public isPriceKeeper;
    mapping(uint256 => uint256) public indexPrice;
    mapping(uint256 => uint256) public priceBufferUpdatedTime;
    mapping(uint256 => int256) public lastPriceBuffer;

    event Execution(uint256 marketId, int256 price);

    constructor(address _orderBook, address _keeperAddress) {
        orderBook = OrderBook(_orderBook);
        isPriceKeeper[_keeperAddress] = true;
    }

    modifier onlyPriceKeeper() {
        require(
            isPriceKeeper[msg.sender],
            "PriceManager: Should be called by keeper"
        );
        _;
    }

    function setPrice(
        uint256[] calldata _marketId,
        uint256[] calldata _price, // new index price from the data source
        bool _isInitialize
    ) external onlyPriceKeeper {
        require(_marketId.length == _price.length, "PriceManager: Wrong input");
        uint256 l = _marketId.length;

        for (uint256 i = 0; i < l; i++) {
            require(_price[i] > 0, "PriceManager: price has to be positive");

            indexPrice[_marketId[i]] = _price[i];
            // int256 currentPriceBuffer = getPriceBuffer(_marketId[i]); // % of price shift

            // int256 currentPriceBufferInUsd = ((_price[i]).toInt256() *
            //     currentPriceBuffer) / (PRICE_BUFFER_PRECISION).toInt256();

            // // int prevMarkPrice = indexPrice[_marketId[i]] +
            // //     currentPriceBufferInUsd;
            // uint256 currentMarkPrice = ((_price[i]).toInt256() +
            //     currentPriceBufferInUsd).toUint256();

            // uint256 markPriceWithLimitOrderPriceImpact;

            bool checkBuyOrderBook = _price[i] < indexPrice[_marketId[i]];

            if (_isInitialize) {
                // markPriceWithLimitOrderPriceImpact = currentMarkPrice;
            } else {
                orderBook.executeLimitOrders(
                    checkBuyOrderBook, // isBuy
                    _marketId[i]
                );
            }

            // console.log(
            //     "PriceManager: markPriceWithLimitOrderPriceImpact: ",
            //     markPriceWithLimitOrderPriceImpact
            // );
            /*
            // TODO: set price with markPriceWithLimitOrderPriceImpact
            int256 newPriceBuffer = (((markPriceWithLimitOrderPriceImpact)
                .toInt256() - (_price[i]).toInt256()) *
                (PRICE_BUFFER_PRECISION).toInt256()) / (_price[i]).toInt256();

            setPriceBuffer(_marketId[i], newPriceBuffer);
            console.log(
                "PriceManager: newPriceBuffer: ",
                (newPriceBuffer).toUint256()
            );
            console.log("PriceManager: _price[i]: ", _price[i]);
            console.log("\n");
            */
        }
    }

    /* 
    Old version (With decay)
    function getPriceBuffer(uint256 _marketId) public view returns (int256) {
        int256 elapsedTime = (block.timestamp -
            priceBufferUpdatedTime[_marketId]).toInt256();
        int256 decayedAmount = elapsedTime * (DECAY_CONSTANT).toInt256();
        int256 absLastPriceBuffer = lastPriceBuffer[_marketId] >= 0
            ? lastPriceBuffer[_marketId]
            : -lastPriceBuffer[_marketId];
        if (decayedAmount >= absLastPriceBuffer) {
            return 0;
        }
        if (lastPriceBuffer[_marketId] >= 0) {
            return lastPriceBuffer[_marketId] - decayedAmount;
        } else {
            return lastPriceBuffer[_marketId] + decayedAmount;
        }
    }
    */
    function getPriceBuffer(uint256 _marketId) public view returns (int256) {
        return
            tokenInfo.getBaseTokenSizeToPriceBufferDeltaMultiplier(_marketId) *
            (globalState.getOpenInterest(_marketId, true) -
                globalState.getOpenInterest(_marketId, false));
    }

    function getIndexPrice(uint256 _marketId) public view returns (uint256) {
        return indexPrice[_marketId];
    }

    function getMarkPrice(uint256 _marketId) public view returns (uint256) {
        int256 newPriceBuffer = getPriceBuffer(_marketId);
        int256 newPriceBufferInUsd = ((indexPrice[_marketId]).toInt256() *
            newPriceBuffer) / (PRICE_BUFFER_PRECISION).toInt256();
        return
            ((indexPrice[_marketId]).toInt256() + newPriceBufferInUsd)
                .toUint256();
    }

    function getAvgExecPrice(
        uint256 _marketId,
        uint256 _size,
        bool _isBuy
    ) public view returns (uint256) {
        uint256 indexPrice = getIndexPrice(_marketId);
        // require first bit of _size is 0
        uint256 tokenDecimals = tokenInfo.getBaseTokenDecimals(_marketId);
        uint256 sizeInUsd = (_size * getIndexPrice(_marketId)) /
            10 ** tokenDecimals;
        require(indexPrice > 0, "PriceManager: price not set");
        int256 intSize = _isBuy
            ? (sizeInUsd).toInt256()
            : -(sizeInUsd).toInt256();
        int256 priceBufferChange = (intSize *
            (tokenInfo.getBaseTokenSizeToPriceBufferMultiplier(_marketId))
                .toInt256()) / (SIZE_TO_PRICE_BUFFER_PRECISION).toInt256();
        int256 averagePriceBuffer = (getPriceBuffer(_marketId) +
            priceBufferChange) / 2;
        int256 averageExecutedPrice = (indexPrice).toInt256() +
            ((indexPrice).toInt256() * averagePriceBuffer) /
            (PRICE_BUFFER_PRECISION).toInt256();
        // emit Execution(_marketId, averageExecutedPrice);
        return (averageExecutedPrice).toUint256();
    }
    /*
    function getAvgExecPriceAndUpdatePriceBuffer(
        uint256 _marketId,
        uint256 _size,
        bool _isBuy
    ) external returns (uint256) {
        uint256 avgExecPrice = getAvgExecPrice(_marketId, _size, _isBuy);
        uint256 tokenDecimals = tokenInfo.getBaseTokenDecimals(_marketId);
        uint256 sizeInUsd = (_size * getIndexPrice(_marketId)) /
            10 ** tokenDecimals;
        int256 intSize = _isBuy
            ? (sizeInUsd).toInt256()
            : -(sizeInUsd).toInt256();
        int256 priceBufferChange = (intSize *
            (tokenInfo.getBaseTokenSizeToPriceBufferMultiplier(_marketId))
                .toInt256()) /
            (TOKEN_PRICE_BUFFER_CONSTANT_PRECISION).toInt256();
        setPriceBuffer(
            _marketId,
            getPriceBuffer(_marketId) + priceBufferChange
        );
        return avgExecPrice;
    }
    */
}
