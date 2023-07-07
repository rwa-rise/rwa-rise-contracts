import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

// TODO: Order 기록 관련 테스트

describe("L3Vault", function () {
  async function deployL3VaultFixture() {
    const [deployer, lp, trader] = await ethers.getSigners();
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    const priceFeed = await PriceFeed.deploy();
    const L3Vault = await ethers.getContractFactory("L3Vault");
    const l3Vault = await L3Vault.deploy(priceFeed.address);
    const ETH_ID = 1;
    return { l3Vault, priceFeed, deployer, lp, trader, ETH_ID };
  }

  describe("Deployment", function () {
    it("Should be deployed with PriceFeed contract address", async function () {
      const { l3Vault, priceFeed } = await loadFixture(deployL3VaultFixture);
      expect(await l3Vault.priceFeed()).to.equal(priceFeed.address);
    });
  });

  describe("Liquidity Pool", function () {
    it("Should be able to add liquidity", async function () {
      const { l3Vault, lp, ETH_ID } = await loadFixture(deployL3VaultFixture);
      const _assetId = ETH_ID;
      const _amount = ethers.utils.parseEther("100");

      expect(await l3Vault.tokenPoolAmounts(_assetId)).to.equal(0);
      await l3Vault.connect(lp).addLiquidity(_assetId, _amount);
      expect(await l3Vault.tokenPoolAmounts(_assetId)).to.equal(_amount);
    });
  });

  describe("Open Position Integration Test", function () {
    // flow: add liquidity => deposit ETH => set price (PriceFeed) => open position
    it("Should be able to open then close a long position", async function () {
      const { l3Vault, priceFeed, deployer, lp, trader, ETH_ID } =
        await loadFixture(deployL3VaultFixture);

      // 1. add liquidity (lp)
      const _amount = ethers.utils.parseEther("1000");
      await l3Vault.connect(lp).addLiquidity(ETH_ID, _amount);
      expect(await l3Vault.tokenPoolAmounts(ETH_ID)).to.equal(_amount);

      // 2. deposit 90 ETH (trader)
      const _value = ethers.utils.parseEther("90");
      await l3Vault.connect(trader).depositEth({ value: _value });
      const _traderAddress = await trader.getAddress();
      expect(
        (await l3Vault.traderBalances(_traderAddress, ETH_ID)).balance
      ).to.equal(_value);

      // inspect state variables before opening the position
      // traderBalances, tokenPoolAmounts, tokenReserveAmounts, positions

      console.log("\n\n---------- Before opening the position ----------");
      console.log(
        ">>> trader ETH balance: ",
        ethers.utils.formatEther(
          (await l3Vault.traderBalances(_traderAddress, ETH_ID)).balance
        ),
        " ETH"
      );
      console.log(
        ">>> ETH pool amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenPoolAmounts(ETH_ID)),
        "ETH"
      );
      console.log(
        ">>> ETH reserve amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenReserveAmounts(ETH_ID)),
        "ETH"
      );

      // 3. set price (PriceFeed) (deployer)
      const _price = ethers.utils.parseUnits("1923.56", 8);
      await priceFeed.setPrice(ETH_ID, _price);
      expect(await priceFeed.getPrice(ETH_ID)).to.equal(_price);

      // 4. open position (trader)
      const _account = await trader.getAddress();
      const _collateralAssetId = ETH_ID; // ETH
      const _indexAssetId = ETH_ID; // ETH
      const _size = ethers.utils.parseEther("225"); // 225 ETH
      const _collateralSize = ethers.utils.parseEther("45"); // 45 ETH, x5 leverage
      const _isLong = true;
      const _isMarketOrder = true;

      const _positionKey = await l3Vault
        .connect(trader)
        .callStatic.openPosition(
          _account,
          _collateralAssetId,
          _indexAssetId,
          _size,
          _collateralSize,
          _isLong,
          _isMarketOrder
        );

      expect(
        await l3Vault
          .connect(trader)
          .openPosition(
            _account,
            _collateralAssetId,
            _indexAssetId,
            _size,
            _collateralSize,
            _isLong,
            _isMarketOrder
          )
      ).not.to.be.reverted;

      // 5. check position
      const position = await l3Vault.getPosition(_positionKey);
      expect(position.size).to.equal(_size);
      expect(position.collateralSize).to.equal(_collateralSize);
      expect(position.avgOpenPrice).to.equal(_price);
      console.log("\n\n---------- After opening the position ----------");
      console.log(
        ">>> trader ETH balance: ",
        ethers.utils.formatEther(
          (await l3Vault.traderBalances(_traderAddress, ETH_ID)).balance
        ),
        " ETH"
      );
      console.log(
        ">>> ETH pool amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenPoolAmounts(ETH_ID)),
        "ETH"
      );
      console.log(
        ">>> ETH reserve amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenReserveAmounts(ETH_ID)),
        "ETH"
      );

      // 6. close position
      // update mark price
      //   const _priceDeltaRatioInPercent = -5; // 5% decrease
      //   const _newPrice = _price.mul(100 + _priceDeltaRatioInPercent).div(100);
      const _newPrice = ethers.utils.parseUnits("1909.19", 8);
      await priceFeed.setPrice(ETH_ID, _newPrice);
      expect(await priceFeed.getPrice(ETH_ID)).to.equal(_newPrice);

      expect(
        await l3Vault
          .connect(trader)
          .closePosition(
            _account,
            _collateralAssetId,
            _indexAssetId,
            _isLong,
            _isMarketOrder
          ) // => open position할 때의 값을 재활용
      ).not.to.be.reverted;

      console.log("\n\n---------- After closing the position ----------");
      console.log(
        ">>> trader ETH balance: ",
        ethers.utils.formatEther(
          (await l3Vault.traderBalances(_traderAddress, ETH_ID)).balance
        ),
        " ETH"
      );
      console.log(
        ">>> ETH pool amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenPoolAmounts(ETH_ID)),
        "ETH"
      );
      console.log(
        ">>> ETH reserve amounts: ",
        ethers.utils.formatEther(await l3Vault.tokenReserveAmounts(ETH_ID)),
        "ETH"
      );
      //   console.log(">>> position: ", await l3Vault.getPosition(_positionKey));
    });
  });
});