import { getContractsContext } from "../getContractsContext";
import { formatPositionRecord } from "../../utils/formatter";
import { getPresetAddress } from "../../utils/getPresetAddress";

export async function getPositionRecord(
  trader: string,
  positionRecordId: number
) {
  const ctx = getContractsContext();

  const positionRecord = await ctx.positionHistory.positionRecords(
    trader,
    positionRecordId
  );

  console.log("getPositionRecord:", formatPositionRecord(positionRecord));

  return positionRecord;
}

export async function getPositionRecords(trader: string) {
  const ctx = getContractsContext();
  const traderTraderRecordCount =
    await ctx.traderVault.getTraderPositionRecordCount(trader);

  const positionRecords = [];
  for (let i = 0; i < traderTraderRecordCount; i++) {
    const positionRecord = await getPositionRecord(trader, i);
    positionRecords.push(positionRecord);
  }
  return positionRecords;
}

async function main() {
  const deployer = getPresetAddress("deployer");
  await getPositionRecord(deployer, 1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
