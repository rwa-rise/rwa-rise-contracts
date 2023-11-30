import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatUSDC } from "../../utils/formatter";

export async function getIndexPrice() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  const indexPrice = await ctx.priceFetcher._getIndexPrice(
    c.ETH_USDC_MARKET_ID
  );
  console.log(">>> ETH/USD indexPrice: ", formatUSDC(indexPrice));
  return indexPrice;
}

async function main() {
  await getIndexPrice();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
