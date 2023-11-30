import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";
import { formatPriceBuffer } from "../../utils/formatter";

export async function getPriceBuffer() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  const priceBuffer = await ctx.priceManager.getPriceBuffer(
    c.ETH_USDC_MARKET_ID
  );
  console.log(
    ">>> ETH/USD market Price Buffer: ",
    formatPriceBuffer(priceBuffer)
  );
  return priceBuffer;
}

async function main() {
  await getPriceBuffer();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
