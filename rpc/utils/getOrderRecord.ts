import { getContractsContext } from "../getContractsContext";
import { formatOrderRecord } from "../../utils/formatter";
import { getPresetAddress } from "../../utils/getPresetAddress";

export async function getOrderRecord(trader: string, orderRecordId: number) {
  const ctx = getContractsContext();
  const orderRecord = await ctx.orderHistory.orderRecords(
    trader,
    orderRecordId
  );

  console.log("getOrderRecord:", formatOrderRecord(orderRecord));
  return orderRecord;
}

export async function getOrderRecords(trader: string) {
  const ctx = getContractsContext();
  const traderOrderRecordCount =
    await ctx.traderVault.getTraderOrderRecordCount(trader);

  const orderRecords = [];
  for (let i = 0; i < traderOrderRecordCount; i++) {
    const orderRecord = await getOrderRecord(trader, i);
    orderRecords.push(orderRecord);
  }
  return orderRecords;
}

async function main() {
  const deployer = getPresetAddress("deployer");
  await getOrderRecord(deployer, 0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
