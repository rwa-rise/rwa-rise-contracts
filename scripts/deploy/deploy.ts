import * as fs from "fs";
import { Network } from "../../utils/network";
import { deployContract } from "../../utils/deployer";
import { getLibraryAddress } from "../../utils/getLibraryAddress";
import { getContractAddress } from "../../utils/getContractAddress";
import { getPresetAddress } from "../../utils/getPresetAddress";

export type Addresses = {
  TestUSDC: string;
  TraderVault: string;
  Market: string;
  TokenInfo: string;
  ListingManager: string;
  RisePool: string;
  GlobalState: string;
  PriceManager: string;
  PriceFetcher: string;
  Liquidation: string;
  Funding: string;
  PositionVault: string;
  OrderValidator: string;
  OrderHistory: string;
  PositionHistory: string;
  PositionFee: string;
  PositionManager: string;
  MarketOrder: string;
  OrderBook: string;
  OrderRouter: string;
};

async function main() {
  await deployContracts();
}

async function deployContracts(): Promise<Addresses> {
  /// Libraries

  // MathUtils
  const mathUtils = getLibraryAddress("MathUtils");

  // PositionUtils
  const positionUtils = getLibraryAddress("PositionUtils");

  // OrderUtils
  const orderUtils = getLibraryAddress("OrderUtils");

  // PnlUtils
  const pnlUtils = getLibraryAddress("PnlUtils");

  // Test USDC
  const usdc = await deployContract("TestUSDC");

  // TraderVault
  const traderVault = await deployContract("TraderVault");

  // Market
  const market = await deployContract("Market");

  // TokenInfo
  const tokenInfo = await deployContract("TokenInfo", [market.address]);

  // ListingManager
  const listingManager = await deployContract("ListingManager", [
    market.address,
  ]);

  // RisePool
  const risePool = await deployContract("RisePool");

  // GlobalState
  const globalState = await deployContract("GlobalState", [], {
    PositionUtils: positionUtils,
  });


  // PriceManager
  const priceManager = await deployContract("PriceManager", [
    globalState.address,
    tokenInfo.address,
  ]);

  // PriceFetcher
  const priceFetcher = await deployContract("PriceFetcher", [
    priceManager.address,
  ]);

  // Liquidation
  const liquidation = await deployContract(
    "Liquidation",
    [
      priceManager.address,
      traderVault.address,
      tokenInfo.address,
      market.address,
    ],
    {
      MathUtils: mathUtils,
    }
  );

  // Funding
  const funding = await deployContract(
    "Funding",
    [
      priceFetcher.address,
      globalState.address,
      tokenInfo.address,
      market.address,
    ],
    {
      MathUtils: mathUtils,
      OrderUtils: orderUtils,
    }
  );

  // PositionVault
  const positionVault = await deployContract(
    "PositionVault",
    [funding.address],
    { PositionUtils: positionUtils }
  );

  // OrderValidator
  const orderValidator = await deployContract("OrderValidator", [
    positionVault.address,
    globalState.address,
    risePool.address,
  ]);

  // OrderHistory
  const orderHistory = await deployContract("OrderHistory", [
    traderVault.address,
  ]);

  // PositionHistory
  const positionHistory = await deployContract(
    "PositionHistory",
    [positionVault.address, traderVault.address],
    { PositionUtils: positionUtils }
  );

  // PositionFee
  const positionFee = await deployContract("PositionFee", [
    traderVault.address,
  ]);

  // PositionManager
  const positionManager = await deployContract(
    "PositionManager",
    [positionVault.address, market.address],
    { OrderUtils: orderUtils, PnlUtils: pnlUtils }
  );

  // MarketOrder
  const marketOrder = await deployContract(
    "MarketOrder",
    [
      traderVault.address,
      risePool.address,
      funding.address,
      market.address,
      positionHistory.address,
      positionVault.address,
      orderValidator.address,
      orderHistory.address,
      priceFetcher.address,
      globalState.address,
      positionFee.address,
    ],
    {
      OrderUtils: orderUtils,
      PnlUtils: pnlUtils,
    }
  );

  // OrderBook
  const orderBook = await deployContract(
    "OrderBook",
    [
      traderVault.address,
      risePool.address,
      funding.address,
      market.address,
      positionHistory.address,
      positionVault.address,
      priceFetcher.address,
      positionFee.address,
    ],
    { MathUtils: mathUtils, OrderUtils: orderUtils, PnlUtils: pnlUtils }
  );

  // OrderRouter
  const orderRouter = await deployContract("OrderRouter", [
    marketOrder.address,
    orderBook.address,
  ]);

  console.log("---------------------------------------------");
  console.log(">>> Contracts Deployed:");
  console.log("Test USDC:", usdc.address);
  console.log("TraderVault:", traderVault.address);
  console.log("Market:", market.address);
  console.log("TokenInfo:", tokenInfo.address);
  console.log("ListingManager:", listingManager.address);
  console.log("RisePool:", risePool.address);
  console.log("GlobalState:", globalState.address);
  console.log("PriceManager:", priceManager.address);
  console.log("PriceFetcher:", priceFetcher.address);
  console.log("Liquidation:", liquidation.address);
  console.log("Funding:", funding.address);
  console.log("PositionVault:", positionVault.address);
  console.log("OrderValidator:", orderValidator.address);
  console.log("OrderHistory:", orderHistory.address);
  console.log("PositionHistory:", positionHistory.address);
  console.log("PositionManager:", positionManager.address);
  console.log("MarketOrder:", marketOrder.address);
  console.log("OrderBook:", orderBook.address);
  console.log("OrderRouter:", orderRouter.address);
  console.log("---------------------------------------------");

  const addresses = {
    TestUSDC: usdc.address,
    TraderVault: traderVault.address,
    Market: market.address,
    TokenInfo: tokenInfo.address,
    RisePool: risePool.address,
    ListingManager: listingManager.address,
    GlobalState: globalState.address,
    PriceManager: priceManager.address,
    PriceFetcher: priceFetcher.address,
    Liquidation: liquidation.address,
    Funding: funding.address,
    PositionVault: positionVault.address,
    OrderValidator: orderValidator.address,
    OrderHistory: orderHistory.address,
    PositionHistory: positionHistory.address,
    PositionFee: positionFee.address,
    PositionManager: positionManager.address,
    MarketOrder: marketOrder.address,
    OrderBook: orderBook.address,
    OrderRouter: orderRouter.address,
  };

  const _filePath = __dirname + "/../output/contractAddresses.json";


  fs.writeFileSync(
    _filePath,
    JSON.stringify({ Baobab: addresses }, null, 2),
    { flag: "w" }
  );

  fs.chmod(_filePath, 0o777, (err) => {
    console.log(err);
  });

  return addresses;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
