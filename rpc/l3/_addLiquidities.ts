import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

/// note: test only
export async function _addLiquidities() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  await ctx.risePool.addLiquidity(
    c.ETH_USDC_MARKET_ID,
    true,
    p.LONG_LIQUIDITY_AMOUNT
  );
  await ctx.risePool.addLiquidity(
    c.ETH_USDC_MARKET_ID,
    false,
    p.SHORT_LIQUIDITY_AMOUNT
  );
}
