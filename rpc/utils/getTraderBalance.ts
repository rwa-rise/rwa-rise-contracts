import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatUSDC } from "../../utils/formatter";
import { getPresetAddress } from "../../utils/getPresetAddress";

/// note: test only
export async function getTraderBalance(trader: string) {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  const traderBalance = await ctx.traderVault.getTraderBalance(
    trader,
    c.USDC_ID
  );
  console.log("getTraderBalance:", formatUSDC(traderBalance));

  return traderBalance;
}

async function main() {
  const deployer = getPresetAddress("deployer");
  await getTraderBalance(deployer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
