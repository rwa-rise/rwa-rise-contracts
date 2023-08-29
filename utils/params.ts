import { ethers } from "ethers";
import { Constants } from "./constants";

export class Params {
  c = new Constants();
  // TODO:check if we need multiplier for USDC
  USDC_MULTIPLIER = ethers.utils.parseUnits(
    "1",
    this.c.PRICE_BUFFER_DELTA_MULTIPLIER_DECIMALS
  );
  ETH_MULTIPLIER = ethers.utils.parseUnits(
    "0.000001",
    this.c.PRICE_BUFFER_DELTA_MULTIPLIER_DECIMALS
  );

  ETH_USDC_MARKET_FUNDING_RATE_MULTIPLIER = ethers.utils.parseUnits(
    "0.001",
    this.c.FUNDING_RATE_MULTIPLIER_DECIMALS
  );

  DEPOSIT_AMOUNT = ethers.utils.parseUnits("500000", this.c.USDC_DECIMALS);

  LONG_LIQUIDITY_AMOUNT = ethers.utils.parseUnits(
    "200000",
    this.c.ETH_DECIMALS
  );
  SHORT_LIQUIDITY_AMOUNT = ethers.utils.parseUnits(
    "400000000",
    this.c.USDC_DECIMALS
  );

  MAX_LONG_CAPACITY = ethers.utils.parseUnits("15000", this.c.ETH_DECIMALS);
  MAX_SHORT_CAPACITY = ethers.utils.parseUnits("15000", this.c.ETH_DECIMALS);
}
