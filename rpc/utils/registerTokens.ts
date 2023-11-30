import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

export async function registerTokens() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  // TODO: check - ETH first, then USDC (now using global token id counter)
  // register & set token data (ETH)
  const tx1 = await ctx.tokenInfo.registerToken(ctx.wethAddress, c.ETH_DECIMALS);
  await tx1.wait();
  const wethAssetId = await ctx.tokenInfo.getAssetIdFromTokenAddress(
    ctx.wethAddress
  );
  // register & set token data (USDC)
  const tx2 = await ctx.tokenInfo.registerToken(ctx.testUSDCAddress, c.USDC_DECIMALS);
  await tx2.wait();
  const testUSDCAssetId = await ctx.tokenInfo.getAssetIdFromTokenAddress(
    ctx.testUSDCAddress
  );
  const tx3 = await ctx.tokenInfo.setSizeToPriceBufferDeltaMultiplier(
    testUSDCAssetId,
    p.USDC_MULTIPLIER
  );
  await tx3.wait();
  console.log("registerToken: testUSDC registered");

  // const wethAssetId = 1;
  const tx4 = await ctx.tokenInfo.setSizeToPriceBufferDeltaMultiplier(
    wethAssetId,
    p.ETH_MULTIPLIER
  );
  await tx4.wait();
  console.log("registerToken: weth registered");
}
