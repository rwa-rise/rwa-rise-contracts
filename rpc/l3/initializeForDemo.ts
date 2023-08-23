import { registerTokens } from "./registerTokens";
import { listPerpMarket } from "./listPerpMarket";
import { _addLiquidities } from "./_addLiquidities";
import { _depositMargin } from "./_depositMargin";
import { setMarketMaxCapacities } from "./setMarketMaxCapacities";
import { _setPrice } from "./_setPrice";

async function main() {
  await registerTokens();
  await listPerpMarket();
  await _addLiquidities();
  await _depositMargin("0xDe264e2133963c9f40e07f290E1D852f7e4e4c7c", "500000");
  await setMarketMaxCapacities();
  // 마지막으로 set price 필요
  // await _setPrice("1948");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
