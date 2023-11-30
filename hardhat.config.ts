import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    klaytn_baobab: {
      url: "https://public-en-baobab.klaytn.net/",
      gasPrice: 250000000000,
      accounts: [process.env.KLAYTN_DEPLOY_PRIVATE_KEY as string],
    },
  },
};

export default config;
