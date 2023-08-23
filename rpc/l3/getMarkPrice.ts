import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatUSDC } from "../../utils/formatter";

export async function getMarkPrice() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  const markPrice = await ctx.priceFetcher._getMarkPrice(c.ETH_USDC_MARKET_ID);
  console.log(">>> ETH/USD markPrice: ", formatUSDC(markPrice));
  return markPrice;
}

async function main() {
  await getMarkPrice();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
