import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatETH } from "../../utils/formatter";

export async function getOIDifference() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  const oiDiff = await ctx.globalState.getLongShortOIDiff(c.ETH_USDC_MARKET_ID);
  console.log(">>> ETH/USD OI difference: ", formatETH(oiDiff), "ETH");
  return oiDiff;
}

async function main() {
  await getOIDifference();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
