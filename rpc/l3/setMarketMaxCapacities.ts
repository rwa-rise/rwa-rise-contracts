import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

/// note: test only
export async function setMarketMaxCapacities() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  await ctx.positionVault.setMaxLongCapacity(
    c.ETH_USDC_MARKET_ID,
    p.MAX_LONG_CAPACITY
  );
  await ctx.positionVault.setMaxShortCapacity(
    c.ETH_USDC_MARKET_ID,
    p.MAX_SHORT_CAPACITY
  );
}
