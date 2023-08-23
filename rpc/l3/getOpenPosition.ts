import { ethers } from "ethers";
import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatPosition } from "../../utils/formatter";
import { getPresetAddress } from "../../utils/getPresetAddress";

export async function getOpenPosition(
  trader: string,
  isLong: boolean,
  marketId: number
) {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();

  const key = await ctx.orderUtils._getPositionKey(
    trader,
    isLong,
    c.ETH_USDC_MARKET_ID // marketId
  );

  const position = await ctx.positionVault.getPosition(key);

  console.log("getOpenPosition:", formatPosition(position));

  return position;
}

async function main() {
  const c = new Constants();
  const deployer = getPresetAddress("deployer");
  await getOpenPosition(deployer, false, c.ETH_USDC_MARKET_ID);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
