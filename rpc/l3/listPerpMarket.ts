import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

export async function listPerpMarket() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  let m = {
    marketId: c.ETH_USDC_MARKET_ID,
    priceTickSize: c.ETH_USDC_MARKET_TICK_SIZE,
    baseAssetId: c.ETH_ID,
    quoteAssetId: c.USDC_ID,
    longReserveAssetId: c.ETH_ID,
    shortReserveAssetId: c.USDC_ID,
    marginAssetId: c.USDC_ID,
    fundingRateMultiplier: p.ETH_USDC_MARKET_FUNDING_RATE_MULTIPLIER,
  };

  await ctx.listingManager.createRisePerpsMarket(m);
}
