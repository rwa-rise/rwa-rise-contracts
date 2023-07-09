// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/IPriceFeed.sol";
import "./interfaces/IERC20.sol";

contract L3Vault {
    uint256 public constant ETH_ID = 1;

    enum OrderType {
        Open,
        Increase,
        Decrease,
        Close,
        Liquidate
    }

    struct UserVault {
        bytes32 versionHash;
        uint256 balance;
        uint256 orderCount; // TODO: 조회 시간 delay가 너무 길 경우 제거
    }

    // TODO: Order history 추가
    // TODO: Position의 <open - close>를 하나의 쌍으로 관리할 것인지, 별도의 Buy / Sell order로 관리할 것인지 결정
    struct Order {
        bool isLong;
        bool isMarketOrder;
        OrderType orderType; // open=0, increase=1, decrease=2, close=3, liquidate=4
        uint256 sizeDeltaAbs;
        uint256 markPrice;
        uint256 indexAssetId;
        uint256 collateralAssetId;
        // value change 등 추가
    }

    // traderAddress, isLong, indexAssetId, collateralAssetId는 key로 사용
    struct Position {
        bool hasProfit;
        // bool isOpen; // not needed
        uint256 size;
        uint256 collateralSize;
        uint256 avgOpenPrice;
        uint256 avgClosePrice;
        uint256 lastUpdatedTime;
        uint256 realizedPnlInUsd;
        uint256 realizedPnlInIndexTokenCount;
    }

    struct GlobalPositionState {
        uint256 totalSize;
        uint256 totalCollateral;
        uint256 averagePrice;
    }

    event DepositEth(address indexed user, uint256 amount);

    event WithdrawEth(address indexed user, uint256 amount);

    event AddLiquidity(address indexed user, uint256 assetId, uint256 amount);

    event RemoveLiquidity(
        address indexed user,
        uint256 assetId,
        uint256 amount
    );
    event OrderPlaced(address indexed user, uint256 orderId);

    // event OrderCanceled(address indexed user, uint256 orderId);

    // to add a version hash or something?
    event UpdateGlobalPositionState(
        bool _isLong,
        uint256 newTotalSize,
        uint256 newTotalCollateral,
        uint256 newAvgPrice
    );

    event OpenPosition(
        bytes32 positionKey,
        address indexed user,
        uint256 collateralAssetId,
        uint256 indexAssetId,
        uint256 size,
        uint256 collateralSize,
        bool isLong,
        uint256 openPrice
    );

    event ClosePosition(
        bytes32 positionKey,
        address indexed user,
        uint256 collateralAssetId,
        uint256 indexAssetId,
        uint256 size,
        uint256 collateralSize,
        bool isLong,
        uint256 closePrice,
        uint256 realizedPnlAbs,
        bool isPositive
    );

    // mapping to MerkleTree
    IPriceFeed public priceFeed;
    mapping(uint256 => uint256) public balancesTracker; // only used in _depositInAmount
    mapping(address => mapping(uint256 => UserVault)) public traderBalances; // userKey => assetId => UserVault
    mapping(address => mapping(uint256 => Order)) public traderOrders; // userKey => orderId => Order

    mapping(uint256 => uint256) public tokenPoolAmounts; // assetId => tokenCount
    mapping(uint256 => uint256) public tokenReserveAmounts; // assetId => tokenCount

    // mapping(uint256 => GlobalLongPositionState) public globalLongStates;
    // mapping(uint256 => GlobalShortPositionState) public globalShortStates;

    mapping(bool => GlobalPositionState) public globalPositionState; // isLong => GlobalPositionState

    mapping(bytes32 => Position) public positions; // positionHash => Position

    constructor(address _priceFeed) {
        priceFeed = IPriceFeed(_priceFeed);
    }

    // What if the trader requests two different orders with the same index Asset?
    // => The second order should be 'Increase Position', being integrated with the first order.
    function _getPositionKey(
        address _account,
        uint256 _collateralAssetId,
        uint256 _indexAssetId,
        bool _isLong
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _account,
                    _collateralAssetId,
                    _indexAssetId,
                    _isLong
                )
            );
    }

    function getMarkPrice(uint256 assetId) internal view returns (uint256) {
        // to implement in customized ArbOS
        return priceFeed.getPrice(assetId);
    }

    // function getPoolAmount(uint256 assetId) public view returns (uint256) {
    //     return tokenPoolAmounts[assetId];
    // }

    // function getReserveAmount(uint256 assetId) public view returns (uint256) {
    //     return tokenReserveAmounts[assetId];
    // }

    function addLiquidity(uint256 assetId, uint256 amount) external payable {
        require(msg.value >= amount, "L3Vault: insufficient amount");
        // liquidity 기록을 변수에 할지, LP 토큰을 발행할지 결정
        // lp에게 토큰 받아서 예치하기
        // 발행한다면 모든 settlement chain에? (e.g. Arbitrum, zkSync, etc.)
        tokenPoolAmounts[assetId] += amount;
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        } // refund

        emit AddLiquidity(msg.sender, assetId, amount);
    }

    function removeLiquidity(uint256 assetId, uint256 amount) external {
        tokenPoolAmounts[assetId] -= amount;
        payable(msg.sender).transfer(amount);

        emit RemoveLiquidity(msg.sender, assetId, amount);
    }

    // for ERC-20
    function _depositInAmount(address _token) private returns (uint256) {
        uint256 prevBalance = balancesTracker[_token];
        uint256 currentBalance = IERC20(_token).balanceOf(address(this)); // L3Vault balance
        balancesTracker[_token] = currentBalance;

        return currentBalance.sub(prevBalance); // L3Vault balance delta
    }

    // for ETH
    function _depositInAmountEth() private returns (uint256) {
        uint256 prevBalance = balancesTracker[address(0)]; // allocate ETH to address(0)
        uint256 currentBalance = address(this).balance; // L3Vault balance
        balancesTracker[address(0)] = currentBalance;

        return currentBalance.sub(prevBalance); // L3Vault balance delta
    }

    // L3 계정에서 직접 ETH를 입금할 때 필요한 로직
    function depositEth() external payable {
        require(msg.value > 0, "L3Vault: deposit amount should be positive");
        UserVault storage userEthVault = traderBalances[msg.sender][ETH_ID];
        userEthVault.balance += msg.value;
        bytes32 prevVersionHash = userEthVault.versionHash;
        userEthVault.versionHash = keccak256(
            abi.encodePacked(prevVersionHash, msg.value)
        );

        emit DepositEth(msg.sender, msg.value);
    }

    // deposit ETH from L2
    // Nitro에서 call하는 함수. Inbox의 요청을 실행할 때 호출
    // 로직
    // 0. 이 함수는 ArbOS에서 L2->L3 ETH deposit의 auto redemption 과정의 일부로써, L3의 트레이더 계정에 직접 ETH를 보내는 대신 L3Vault에 ETH를 보내고 traderBalances를 업데이트해주는 과정
    // 1. 이번 함수 call에서 _transferIn이 원래 의도한 보내려는 value와 일치하는지 검사하고 (GMX _transferIn 구현 참고)
    // 2. traderBalances에 ETH를 추가해준다.
    // 3. ETH를 L3Vault에 보낸다.
    // 4. 이벤트를 발생시킨다.
    // 5. 이번 함수 call에서 _transferIn이 원래 의도한 보내려는 value보다 더 많은 value를 받았다면, 그 차액을 다시 L2로 보낸다. => 이런 로직 필요 없음. 무조건 정확하게 System control

    function withdrawEth(uint256 amount) external {
        UserVault storage userEthVault = traderBalances[msg.sender][ETH_ID];
        require(
            userEthVault.balance >= amount,
            "L3Vault: insufficient balance"
        );
        userEthVault.balance -= amount;
        bytes32 prevVersionHash = userEthVault.versionHash;
        userEthVault.versionHash = keccak256(
            abi.encodePacked(prevVersionHash, amount)
        );

        payable(msg.sender).transfer(amount);

        emit WithdrawEth(msg.sender, amount);
    }

    // open Position (market order)
    // open, close => collateral 변경 / increase, decrease => collateral 변경 X
    function openPosition(
        address _account,
        uint256 _collateralAssetId,
        uint256 _indexAssetId,
        uint256 _size,
        uint256 _collateralSize,
        bool _isLong,
        bool _isMarketOrder
    ) external returns (bytes32) {
        // Create Order & Update Position
        require(_size > 0, "L3Vault: size should be positive");
        require(
            _collateralSize > 0,
            "L3Vault: collateralSize should be positive"
        );
        require(
            tokenPoolAmounts[_indexAssetId] >= _size,
            "L3Vault: insufficient token pool amount"
        );

        uint256 markPrice = getMarkPrice(_indexAssetId);

        UserVault storage userVault = traderBalances[_account][_indexAssetId];

        // record Order
        traderOrders[_account][userVault.orderCount] = Order(
            _isLong,
            _isMarketOrder,
            OrderType.Open,
            _size,
            markPrice,
            _indexAssetId,
            _collateralAssetId
        );

        emit OrderPlaced(_account, userVault.orderCount);

        userVault.orderCount += 1;

        bytes32 key = _getPositionKey(
            _account,
            _collateralAssetId,
            _indexAssetId,
            _isLong
        );

        Position storage position = positions[key];

        require(position.size == 0, "L3Vault: position already exists");

        // update position fields
        position.size = _size;
        position.collateralSize = _collateralSize;
        position.avgOpenPrice = markPrice;
        // position.realizedPnlInUsd = 0; // already initialized as 0
        position.lastUpdatedTime = block.timestamp;

        require(
            userVault.balance >= _collateralSize,
            "L3Vault: insufficient balance"
        );

        userVault.balance -= _collateralSize; // TODO: 여기 로직

        // update tokenPoolAmounts
        // tokenPoolAmounts[_collateralAssetId] += _collateralSize;
        // tokenPoolAmounts[_indexAssetId] -= _size; // => reserve 기록하므로, 따로 차감하지 않음

        // update tokenReserveAmounts
        tokenReserveAmounts[_indexAssetId] += _size;

        emit OpenPosition(
            key,
            _account,
            _collateralAssetId,
            _indexAssetId,
            _size,
            _collateralSize,
            _isLong,
            markPrice
        );

        updateGlobalPositionState(
            _isLong,
            true,
            _size,
            _collateralSize,
            markPrice
        );

        emit UpdateGlobalPositionState(
            _isLong,
            globalPositionState[_isLong].totalSize,
            globalPositionState[_isLong].totalCollateral,
            globalPositionState[_isLong].averagePrice
        );

        return key;
    }

    // close Position
    // TODO: decrease position 추가
    function closePosition(
        address _account,
        uint256 _collateralAssetId,
        uint256 _indexAssetId,
        bool _isLong,
        bool _isMarketOrder
    ) external returns (bool) {
        uint256 markPrice = getMarkPrice(_indexAssetId);

        bytes32 key = _getPositionKey(
            _account,
            _collateralAssetId,
            _indexAssetId,
            _isLong
        );

        Position storage position = positions[key];

        UserVault storage userVault = traderBalances[_account][_indexAssetId];

        // record Order
        traderOrders[_account][userVault.orderCount] = Order(
            _isLong,
            _isMarketOrder,
            OrderType.Close,
            position.size,
            markPrice,
            _indexAssetId,
            _collateralAssetId
        );

        emit OrderPlaced(_account, userVault.orderCount);

        userVault.orderCount += 1;

        position.avgClosePrice = markPrice; // TODO: update, not set
        // uint256 collateralSize = position.collateralSize;
        // pnlAbs is in USD value (decimals = 8)
        (uint256 pnlUsdAbs, bool isPositive) = _calculatePnL(
            position.size,
            position.avgOpenPrice,
            markPrice,
            _isLong
        );

        // => (collateralSize + pnl) < 0이면, 이전에 liquidation 되어야 함
        // 청산 여부 검사 후 liquidation function call하고 종료

        // PnL 정산 (trader)
        // console.log(
        //     ">>> [Contract Log] position.collateralSize: ",
        //     position.collateralSize / 10 ** 18,
        //     " ETH"
        // );
        console.log(
            ">>> [Contract Log] pnlUsdAbs: ~",
            pnlUsdAbs / 10 ** 8,
            " USD"
        ); // decimals = 8
        console.log(
            ">>> [Contract Log] pnl in ETH: ~",
            _usdToToken(pnlUsdAbs, markPrice, 18) / 10 ** 17,
            " * 0.1 ETH"
        );
        console.log(">>> [Contract Log] isProfit: ", isPositive);
        // USD to ETH

        /** Due to stack too deep error, eliminated local variable
        uint256 traderRefund = isPositive
            ? (position.collateralSize + _usdToToken(pnlUsdAbs, markPrice, 18))
            : (position.collateralSize - _usdToToken(pnlUsdAbs, markPrice, 18));
        userVault.balance += traderRefund; // balanceDelta (= in ETH)
        */
        userVault.balance = isPositive
            ? userVault.balance +
                (position.collateralSize +
                    _usdToToken(pnlUsdAbs, markPrice, 18))
            : userVault.balance +
                (position.collateralSize -
                    _usdToToken(pnlUsdAbs, markPrice, 18));

        // console.log(">>> [Contract Log] traderRefund: ", traderRefund / 10 ** 18, " ETH");

        // PnL 정산 (token pool => 현재 USD value만큼 index 토큰 개수 차감)
        require(
            tokenPoolAmounts[_indexAssetId] >=
                _usdToToken(pnlUsdAbs, markPrice, 18),
            "L3Vault: insufficient token pool amount"
        );
        tokenPoolAmounts[_indexAssetId] = isPositive // isPositive => Loss for the pool
            ? tokenPoolAmounts[_indexAssetId] -
                _usdToToken(pnlUsdAbs, markPrice, 18)
            : tokenPoolAmounts[_indexAssetId] +
                _usdToToken(pnlUsdAbs, markPrice, 18);

        // reserveAmount 줄이기
        require(
            tokenReserveAmounts[_indexAssetId] >= position.size,
            "L3Vault: token reserve amount is not enough"
        );
        tokenReserveAmounts[_indexAssetId] -= position.size;

        updateGlobalPositionState(
            _isLong,
            false,
            position.size,
            position.collateralSize,
            markPrice
        );

        // delete position
        delete positions[key];

        emit ClosePosition(
            key,
            _account,
            _collateralAssetId,
            _indexAssetId,
            position.size,
            position.collateralSize,
            _isLong,
            markPrice,
            pnlUsdAbs,
            isPositive
        );

        return true;
    }

    function updateGlobalPositionState(
        bool _isLong,
        bool _isIncrease,
        uint256 _sizeDelta,
        uint256 _collateralDelta,
        uint256 _markPrice
    ) internal {
        globalPositionState[_isLong].averagePrice = _getNewGlobalAvgPrice(
            _isIncrease,
            globalPositionState[_isLong].totalSize,
            globalPositionState[_isLong].averagePrice,
            _sizeDelta,
            _markPrice
        );

        if (_isIncrease) {
            globalPositionState[_isLong].totalSize += _sizeDelta;
            globalPositionState[_isLong].totalCollateral += _collateralDelta;
        } else {
            globalPositionState[_isLong].totalSize -= _sizeDelta;
            globalPositionState[_isLong].totalCollateral -= _collateralDelta;
        }
    }

    /**
     * (new avg price) * (new size) = (old avg price) * (old size) + (mark price) * (size delta)
     * */
    function _getNewGlobalAvgPrice(
        bool _isIncrease,
        uint256 _oldSize,
        uint256 _oldAvgPrice,
        uint256 _sizeDelta,
        uint256 _markPrice
    ) internal pure returns (uint256) {
        if (_isIncrease) {
            uint256 newSize = _oldSize + _sizeDelta;
            uint256 newAvgPrice = newSize == 0
                ? 0
                : (_oldAvgPrice * _oldSize + _markPrice * _sizeDelta) / newSize;
            return newAvgPrice;
        } else {
            uint256 newSize = _oldSize - _sizeDelta;
            uint256 newAvgPrice = newSize == 0
                ? 0
                : (_oldAvgPrice * _oldSize - _markPrice * _sizeDelta) / newSize;
            return newAvgPrice;
        }
    }

    function _usdToToken(
        uint256 _usdAmount,
        uint256 _tokenPrice,
        uint256 _tokenDecimals
    ) internal pure returns (uint256) {
        return (_usdAmount * 10 ** _tokenDecimals) / _tokenPrice;
    }

    function _calculatePnL(
        uint256 _size,
        uint256 _averagePrice,
        uint256 _markPrice,
        bool _isLong
    ) internal pure returns (uint256, bool) {
        uint256 pnlAbs = _markPrice >= _averagePrice
            ? (_size * (_markPrice - _averagePrice)) / 10 ** 18
            : (_size * (_averagePrice - _markPrice)) / 10 ** 18;
        bool hasProfit = _markPrice >= _averagePrice ? _isLong : !_isLong;
        return (pnlAbs, hasProfit);
    }

    // test-only
    function getPosition(bytes32 _key) external view returns (Position memory) {
        return positions[_key];
    }
}
