#!/bin/sh

HERE=$(dirname $(realpath $0))

npx hardhat run $HERE/deploy/check_deployer.ts --network klaytn_baobab
npx hardhat run $HERE/deploy/deploy_libraries.ts --network klaytn_baobab
npx hardhat run $HERE/deploy/deploy.ts --network klaytn_baobab