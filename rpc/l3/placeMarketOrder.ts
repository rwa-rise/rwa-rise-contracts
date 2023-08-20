import { ethers } from "ethers";
import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

/// note: test only
export async function placeMarketOrder(
  trader: string,
  sizeAbs: string,
  marginAbs: string,
  isLong: boolean,
  isIncrease: boolean
) {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  const orderRequest = {
    trader: trader,
    isLong: isLong,
    isIncrease: isIncrease,
    orderType: 0, // market order
    marketId: c.ETH_USDC_MARKET_ID,
    sizeAbs: ethers.utils.parseUnits(sizeAbs, c.ETH_DECIMALS),
    marginAbs: ethers.utils.parseUnits(marginAbs, c.USDC_DECIMALS),
    limitPrice: 0,
  };

  await ctx.orderRouter.placeMarketOrder(orderRequest);
  console.log("placeMarketOrder: market order placed");
}
