import { ethers } from "ethers";
import { getContract, Network } from "../utils/getContract";
import { getPresetAddress } from "../utils/getPresetAddress";
import { getContractAddress } from "../utils/getContractAddress";

// check test USDC balance on L2

async function main() {
  try {
    // ========================= Set Contract  =========================

    const traderVault = getContract("account", "TraderVault", Network.L3);
    const tokenInfo = getContract("market", "TokenInfo", Network.L2);

    // ==================== Call Contract Functions ====================

    const deployer = getPresetAddress("deployer");
    const usdcAddress = getContractAddress("TestUSDC");
    console.log("usdcAddress: ", usdcAddress);

    const usdcAssetId = await tokenInfo.getAssetIdFromTokenAddress(usdcAddress);

    const traderBalance = await traderVault.getTraderBalance(
      deployer,
      usdcAssetId
    );

    console.log(
      "traderBalance on L3: ",
      ethers.utils.formatEther(traderBalance),
      "tUSDC"
    );

    // =================================================================
  } catch (e) {
    console.log(e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});