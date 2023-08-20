import { registerTokens } from "./registerTokens";
import { listPerpMarket } from "./listPerpMarket";
import { _addLiquidities } from "./_addLiquidities";
import { _depositMargin } from "./_depositMargin";
import { setMarketMaxCapacities } from "./setMarketMaxCapacities";

async function main() {}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
