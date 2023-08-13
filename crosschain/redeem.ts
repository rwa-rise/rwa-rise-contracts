import { ethers } from "ethers";
import { getContract, Network } from "../utils/getContract";
import { getContractAddress } from "../utils/getContractAddress";
import { fetchL3EventLogs, L2ToL1Tx } from "./l3LogFetcher";

async function main() {
  try {
    // ========================= Set Contract  =========================

    const arbSys = getContract(
      "crosschain/interfaces/l3",
      "ArbSys",
      Network.L3,
      true // isPresetAddress
    );

    const nodeInterface = getContract(
      "crosschain/interfaces/l3",
      "NodeInterface",
      Network.L3,
      true // isPresetAddress
    );

    const iOutbox = getContract(
      "crosschain/interfaces/l2",
      "IOutbox", // FIXME:
      Network.L2,
      true // isPresetAddress
    );

    // ==================== Call Contract Functions ====================
    // note: position, index, leaf have the same value

    const l3GatewayAddress = getContractAddress("L3Gateway");
    const l2MarginGatewayAddress = getContractAddress("L2MarginGateway");

    // const tx = await arbSys.sendMerkleTreeState();

    // FIXME: cannot call ArbSys funcions (only callable by zero address)
    // appchain should maintain a variable to store the latest merkle tree size.

    const txHash =
      "0xd507efd2c662b89b3288a6baa9c6be900463d7de6b7bbd3e8991b5c99651c48c";

    const l3EventLog: L2ToL1Tx = await fetchL3EventLogs(txHash);

    const size = 8; // TODO: set
    const leaf = l3EventLog.position;
    console.log(">>> leaf: ", leaf);
    const merkleProof = (await nodeInterface.constructOutboxProof(size, leaf))
      .proof;

    const redeemTx = await iOutbox.executeTransaction(
      merkleProof,
      l3EventLog.position, // index
      l3GatewayAddress, // l2Sender
      l2MarginGatewayAddress, // to
      l3EventLog.arbBlockNum, // l2Block
      l3EventLog.ethBlockNum, // l1Block
      l3EventLog.timestamp, // l2Timestamp
      l3EventLog.callvalue, // value
      l3EventLog.data, // data
      { gasLimit: ethers.BigNumber.from("30000000") }
    );
    redeemTx.wait();

    console.log(">>> redeemTx: ", redeemTx);

    // =================================================================
  } catch (e) {
    console.log(e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
