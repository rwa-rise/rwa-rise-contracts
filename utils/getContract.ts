import { ethers } from "ethers";
import * as path from "path";
import * as fs from "fs";
import { getContractAddress } from "./getContractAddress";
import { getLibraryAddress } from "./getLibraryAddress";
import { getPresetAddress } from "./getPresetAddress";
import { Network, RpcUrl } from "./network";

export function getContract(
  domainPath: string,
  contractName: string,
  network: Network,
  isPresetAddress?: boolean
) {
  const { provider, contractAbi, contractAddress } = getContractBase(
    domainPath,
    contractName,
    network,
    isPresetAddress
  );

  const privateKey = process.env.DEPLOY_PRIVATE_KEY as string;
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

  return contract;
}

export function getReadonlyContract(
  domainPath: string,
  contractName: string,
  network: Network,
  isPresetAddress?: boolean
) {
  const { provider, contractAbi, contractAddress } = getContractBase(
    domainPath,
    contractName,
    network,
    isPresetAddress
  );

  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  return contract;
}

export function getLibrary(
  domainPath: string,
  contractName: string,
  network: Network
) {
  const { provider, contractAbi, libraryAddress } = getLibraryBase(
    domainPath,
    contractName,
    network
  );

  const privateKey = process.env.DEPLOY_PRIVATE_KEY as string;
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(libraryAddress, contractAbi, wallet);

  return contract;
}

function getContractBase(
  domainPath: string,
  contractName: string,
  network: Network,
  isPresetAddress?: boolean
) {
  let provider;

  if (network === Network.L2) {
    provider = new ethers.providers.JsonRpcProvider(RpcUrl.L2);
  } else if (network === Network.L3) {
    provider = new ethers.providers.JsonRpcProvider(RpcUrl.L3);
  } else {
    throw new Error("Invalid network");
  }

  const contractAbiPath = path.join(
    `artifacts/contracts/${domainPath}/${contractName}.sol/${contractName}.json`
  );
  const contractAbiObject = JSON.parse(
    fs.readFileSync(contractAbiPath).toString()
  );
  const contractAbi = contractAbiObject["abi"];

  let contractAddress;

  if (isPresetAddress) {
    contractAddress = getPresetAddress(contractName);
  } else {
    contractAddress = getContractAddress(contractName, network);
  }

  return {
    provider,
    contractAbi,
    contractAddress,
  };
}

function getLibraryBase(
  domainPath: string,
  contractName: string,
  network: Network
) {
  let provider;

  if (network === Network.L2) {
    provider = new ethers.providers.JsonRpcProvider(RpcUrl.L2);
  } else if (network === Network.L3) {
    provider = new ethers.providers.JsonRpcProvider(RpcUrl.L3);
  } else {
    throw new Error("Invalid network");
  }

  const contractAbiPath = path.join(
    `artifacts/contracts/${domainPath}/${contractName}.sol/${contractName}.json`
  );
  const contractAbiObject = JSON.parse(
    fs.readFileSync(contractAbiPath).toString()
  );
  const contractAbi = contractAbiObject["abi"];

  let libraryAddress;

  libraryAddress = getLibraryAddress(contractName);

  return {
    provider,
    contractAbi,
    libraryAddress,
  };
}
