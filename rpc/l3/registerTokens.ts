import { getContractsContext } from "../getContractsContext";
import { Constants } from "../../utils/constants";
import { Params } from "../../utils/params";

export async function registerTokens() {
  const ctx = getContractsContext();
  const c = new Constants();
  const p = new Params();
  // TODO: check - ETH first, then USDC (now using global token id counter)
  // register & set token data (ETH)
  await ctx.tokenInfo.registerToken(ctx.wethAddress, c.ETH_DECIMALS);
  const wethAssetId = await ctx.tokenInfo.getAssetIdFromTokenAddress(
    ctx.wethAddress
  );
  // register & set token data (USDC)
  await ctx.tokenInfo.registerToken(ctx.testUSDCAddress, c.USDC_DECIMALS);
  const testUSDCAssetId = await ctx.tokenInfo.getAssetIdFromTokenAddress(
    ctx.testUSDCAddress
  );
  await ctx.tokenInfo.setSizeToPriceBufferDeltaMultiplier(
    testUSDCAssetId,
    p.USDC_MULTIPLIER
  );
  console.log("registerToken: testUSDC registered");

  // const wethAssetId = 1;
  await ctx.tokenInfo.setSizeToPriceBufferDeltaMultiplier(
    wethAssetId,
    p.ETH_MULTIPLIER
  );
  console.log("registerToken: weth registered");
}
