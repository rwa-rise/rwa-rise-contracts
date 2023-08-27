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

export async function getOIdata() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  const longOI = await ctx.globalState.getLongOpenInterest(
    c.ETH_USDC_MARKET_ID
  );
  const shortOI = await ctx.globalState.getShortOpenInterest(
    c.ETH_USDC_MARKET_ID
  );

  console.log(">>> Long OI: ", formatETH(longOI), "ETH");
  console.log(">>> Short OI: ", formatETH(shortOI), "ETH");
}

async function main() {
  await getOIDifference();
  await getOIdata();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
