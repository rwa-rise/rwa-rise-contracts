import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { ethers } from "ethers";

/// note: test only
export async function _setPrice(price: string) {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  const tx1 = await ctx.priceManager.setPrice(
    c.ETH_USDC_MARKET_ID,
    ethers.utils.parseUnits(price, c.USDC_DECIMALS)
  );

  await tx1.wait();
  console.log(">>> setPrice tx receipt:", tx1);
}
async function main() {
  await _setPrice("2005");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
