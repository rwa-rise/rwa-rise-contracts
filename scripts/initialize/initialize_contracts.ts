import { Network } from "../../utils/network";
import { getContract } from "../../utils/getContract";
import { getContractAddress } from "../../utils/getContractAddress";
import { getPresetAddress } from "../../utils/getPresetAddress";

export async function initialize() {

  const tokenInfo = getContract("market", "TokenInfo", Network.BAOBAB);

  // initialization parameters

  const testUsdcAddress = getContractAddress("TestUSDC", Network.BAOBAB);

  await tokenInfo.registerToken(testUsdcAddress, 18);

  console.log("Contracts initialized");
}

async function main() {
  await initialize();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
