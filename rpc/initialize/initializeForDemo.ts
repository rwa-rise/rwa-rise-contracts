import { registerTokens } from "../utils/registerTokens";
import { listPerpMarket } from "../utils/listPerpMarket";
import { _addLiquidities } from "../utils/_addLiquidities";
import { _depositMargin } from "../utils/_depositMargin";
import { setMarketMaxCapacities } from "../utils/setMarketMaxCapacities";
import { _setPrice } from "../utils/_setPrice";

// 하나씩 실행
async function main() {
  console.log('>>> initializing contracts for demo...')
  // await registerTokens();
  // console.log(">>> registerTokens done.")
  // await listPerpMarket();
  // console.log(">>> listPerpMarket done.") // 1번만 실행
  // await _addLiquidities();
  // console.log(">>> _addLiquidities done.")
  // await setMarketMaxCapacities();
  // console.log(">>> setMarketMaxCapacities done.")
  await _setPrice("2010");
  console.log(">>> _setPrice done.")

  // // not necessary ============================================================
  // await _depositMargin("0x442722B1AbDeBa65Fa206E2F59d2dDCd7d10C1E3", "500000");
  // console.log(">>> _depositMargin done.")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
