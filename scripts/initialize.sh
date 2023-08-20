#!/bin/sh

HERE=$(dirname $(realpath $0))

ts-node $HERE/initialize/initialize_contracts.ts
