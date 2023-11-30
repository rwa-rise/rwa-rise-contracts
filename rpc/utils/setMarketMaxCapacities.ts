import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

/// note: test only
export async function setMarketMaxCapacities() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  const tx1 = await ctx.positionVault.setMaxLongCapacity(
    c.ETH_USDC_MARKET_ID,
    p.MAX_LONG_CAPACITY
  );
  await tx1.wait();
  const tx2 = await ctx.positionVault.setMaxShortCapacity(
    c.ETH_USDC_MARKET_ID,
    p.MAX_SHORT_CAPACITY
  );
  await tx2.wait();
}
