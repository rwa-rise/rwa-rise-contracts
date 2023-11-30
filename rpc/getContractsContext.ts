import { getContract, getLibrary } from "../utils/getContract";
import { getContractAddress } from "../utils/getContractAddress";
import { getPresetAddress } from "../utils/getPresetAddress";
import { Network } from "../utils/network";

export function getContractsContext() {
  const mathUtils = getLibrary("utils", "MathUtils", Network.BAOBAB);
  const orderUtils = getLibrary("order", "OrderUtils", Network.BAOBAB);
  const positionUtils = getLibrary("position", "PositionUtils", Network.BAOBAB);
  const pnlUtils = getLibrary("position", "PnlUtils", Network.BAOBAB);

  const wethAddress = getPresetAddress("WETH");
  const testUSDCAddress = getContractAddress("TestUSDC", Network.BAOBAB);

  const traderVault = getContract("account", "TraderVault", Network.BAOBAB);
  const market = getContract("market", "Market", Network.BAOBAB);
  const tokenInfo = getContract("market", "TokenInfo", Network.BAOBAB);
  const listingManager = getContract("market", "ListingManager", Network.BAOBAB);
  const risePool = getContract("risepool", "RisePool", Network.BAOBAB);
  const globalState = getContract("global", "GlobalState", Network.BAOBAB);
  const priceManager = getContract("price", "PriceManager", Network.BAOBAB);
  const priceFetcher = getContract("order", "PriceFetcher", Network.BAOBAB);
  const liquidation = getContract("liquidation", "Liquidation", Network.BAOBAB);
  const funding = getContract("fee", "Funding", Network.BAOBAB);
  const positionVault = getContract("position", "PositionVault", Network.BAOBAB);
  const orderValidator = getContract("order", "OrderValidator", Network.BAOBAB);
  const orderHistory = getContract("order", "OrderHistory", Network.BAOBAB);
  const positionHistory = getContract(
    "position",
    "PositionHistory",
    Network.BAOBAB
  );
  const positionFee = getContract("fee", "PositionFee", Network.BAOBAB);
  const positionManager = getContract(
    "position",
    "PositionManager",
    Network.BAOBAB
  );
  const marketOrder = getContract("order", "MarketOrder", Network.BAOBAB);
  const orderBook = getContract("orderbook", "OrderBook", Network.BAOBAB);
  const orderRouter = getContract("order", "OrderRouter", Network.BAOBAB);

  return {
    mathUtils,
    positionUtils,
    orderUtils,
    pnlUtils,
    wethAddress,
    testUSDCAddress,
    traderVault,
    market,
    tokenInfo,
    listingManager,
    risePool,
    globalState,
    priceManager,
    priceFetcher,
    liquidation,
    funding,
    positionVault,
    orderValidator,
    orderHistory,
    positionHistory,
    positionFee,
    positionManager,
    marketOrder,
    orderBook,
    orderRouter,
  };
}
