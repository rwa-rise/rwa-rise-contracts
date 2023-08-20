import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

/// note: test only
export async function _depositMargin(trader: string, amount: string) {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  await ctx.traderVault.increaseTraderBalance(trader, c.USDC_ID, amount);
}
