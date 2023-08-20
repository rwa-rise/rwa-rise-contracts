// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../common/structs.sol";
import "../common/constants.sol";

import "../order/PriceFetcher.sol";
import "../global/GlobalState.sol";
import "../order/OrderUtils.sol";
import "../market/TokenInfo.sol";
import "../market/Market.sol";
import "../utils/MathUtils.sol";

import "hardhat/console.sol";

contract Funding {
    using SafeCast for int256;
    using SafeCast for uint256;

    PriceFetcher public priceFetcher;

    GlobalState public globalState;
    TokenInfo public tokenInfo;
    Market public market;

    /// note: `funding rate` and `price buffer rate` should have the same precision (1e16)
    int256 public constant FUNDING_RATE_PRECISION = 1e16;
    int256 public constant PRICE_BUFFER_RATE_PRECISION = 1e16;
    int256 public constant FUNDING_RATE_MULTIPLIER_PRECISION = 1e10;
    int256 public constant FUNDING_INDEX_PRECISION = 1e12;

    /// note: `interest rate`, `funding rate damper` should have the same precision as `price buffer rate` (1e16)

    // interest rate per hour
    int256 public constant interestRatePerHour =
        PRICE_BUFFER_RATE_PRECISION / 1000 / 100; // 0.001% per hour -> x0.00001 per hour

    // interest rate per second
    int256 public constant interestRatePerSecond = interestRatePerHour / 3600; // 0.001% per hour -> x0.00001 / 3600 per second

    // funding rate damper per hour
    int256 public constant fundingRateDamperPerHour =
        (PRICE_BUFFER_RATE_PRECISION * 5) / 10000; // 0.005% per hour -> x0.00005 per hour

    // funding rate damper per second
    int256 public constant fundingRateDamperPerSecond =
        fundingRateDamperPerHour / 3600; // 0.005% per hour -> x0.00005 / 3600 per second

    mapping(uint256 => int256) latestFundingIndex; // assetId => fundingIndex
    mapping(uint256 => uint256) latestFundingTimestamp; // assetId => timestamp

    /// example for the funding rate
    // case: 1000 ETH OI difference
    // price buffer = (OI difference) * (ETH multiplier) = 1000 * 0.0001 = 0.1
    // set price buffer rate to be 0.01% for 1000 ETH OI difference -> 0.01 / 100 = 0.0001
    // price buffer rate = (funding rate multiplier) * (price buffer) = 0.001 * 0.1 = 0.0001
    // funding rate multiplier for ETH USDC market = 0.001

    constructor(
        address _priceFetcher,
        address _globalState,
        address _tokenInfo,
        address _market
    ) {
        priceFetcher = PriceFetcher(_priceFetcher);
        globalState = GlobalState(_globalState);
        tokenInfo = TokenInfo(_tokenInfo);
        market = Market(_market);
    }

    function _initializeFundingForMarket(uint256 _marketId) public {
        latestFundingIndex[_marketId] = 0;
    }

    function _getPriceBufferRatePerHour(
        uint256 _marketId
    ) private view returns (int256) {
        int256 priceBuffer = priceFetcher._getPriceBuffer(_marketId);
        return ((((market.getMarketInfo(_marketId).fundingRateMultiplier *
            priceBuffer) / (FUNDING_RATE_MULTIPLIER_PRECISION)) *
            PRICE_BUFFER_RATE_PRECISION) / PRICE_BUFFER_PRECISION.toInt256());
    }

    function _getFundingRatePerHour(
        uint256 _marketId
    ) public view returns (int256) {
        int256 priceBufferRatePerHour = _getPriceBufferRatePerHour(_marketId);
        // price buffer rate, interest rate per hour, funding rate damper per hour should have the same precision
        return
            priceBufferRatePerHour +
            MathUtils.clamp(
                interestRatePerHour - priceBufferRatePerHour,
                -fundingRateDamperPerHour,
                fundingRateDamperPerHour
            );
    }

    function _getFundingRatePerSecond(
        uint256 _marketId
    ) public view returns (int256) {
        return _getFundingRatePerHour(_marketId) / 3600;
    }

    function getFundingIndex(uint256 _marketId) public view returns (int256) {
        // block timestamp is in seconds

        // FIXME: TODO: check if `_markPrice` should be multiplied for the funding index
        int256 _lastFundingIndex = latestFundingIndex[_marketId];
        int256 _markPrice = priceFetcher._getMarkPrice(_marketId).toInt256();
        int256 _fundingRate = _getFundingRatePerSecond(_marketId);
        int256 _timeElapsed = (block.timestamp -
            latestFundingTimestamp[_marketId]).toInt256();

        // FIXME: use `MulDiv`

        int256 fundingIndex = _lastFundingIndex +
            (((_markPrice * _fundingRate * _timeElapsed) *
                FUNDING_INDEX_PRECISION) /
                (USDC_PRECISION.toInt256() * FUNDING_RATE_PRECISION));

        // TODO: Funding Rate, Funding Index Precision 통합 가능
        // TODO: check - USDC_PRECISION to TOKEN_PRICE_PRECISION ?
        return fundingIndex;
    }

    // onlyKeeper
    function updateFundingIndex(uint256 _marketId) public {
        int256 fundingIndex = getFundingIndex(_marketId);
        latestFundingIndex[_marketId] = fundingIndex;
        latestFundingTimestamp[_marketId] = block.timestamp;
    }

    // funding fee in USD (?)
    function getFundingFeeToPay(
        OpenPosition calldata _position
    ) public view returns (int256) {
        uint256 marketId = _position.marketId;
        uint256 markPrice = priceFetcher._getMarkPrice(marketId);
        int256 sizeInUsd = OrderUtils
            ._tokenToUsd(
                _position.size,
                markPrice,
                tokenInfo.getTokenDecimals(
                    market.getMarketInfo(marketId).baseAssetId
                )
            )
            .toInt256();

        int256 fundingFeeToPay = (sizeInUsd *
            (getFundingIndex(marketId) - _position.avgEntryFundingIndex)) /
            FUNDING_INDEX_PRECISION;

        return fundingFeeToPay;
    }
}
