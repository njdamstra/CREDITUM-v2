const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = ethers;
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("UserPortal", function () {
    let addresses, portal, lendingPool, collateralManager, nftTrader, nftValues, mockOracle, dim, gNft, bNft;
    let addressesAddr, portalAddr, lendingPoolAddr, collateralManagerAddr, nftTraderAddr, nftValuesAddr, dimAddr, mockOracleAddr, gNftAddr, bNftAddr;
    let deployer, lender1, borrower1, borrower2, lender2, liquidator;
    let deployerAddr, lender1Addr, borrower1Addr, borrower2Addr, lender2Addr, liquidatorAddr;
    let useOnChainOracle = true;
    let baseRate, multiplierPreKink, multiplierPostKink, optimalUtilization, reserveFactor, liquidityCeiling, maxBorrowRate;
    let gNftFP, bNftFP

    beforeEach(async function () {
        // Get signers
        [deployer, lender1, borrower1, borrower2, lender2, liquidator, ...others] = await ethers.getSigners();
        deployerAddr = deployer.address;
        console.log("deployers address:", deployerAddr);
        borrower1Addr = borrower1.address;
        console.log("borrower1 address:", borrower1Addr);
        borrower2Addr = borrower2.address;
        console.log("borrower2 address:", borrower2Addr);
        lender1Addr = lender1.address;
        console.log("lender1 address:", lender1Addr);
        lender2Addr = lender2.address;
        console.log("lender2 address:", lender2Addr);
        liquidatorAddr = liquidator.address;
        console.log("liquidator address:", liquidatorAddr);

        // Deploy GoodNFT (Mock NFT contract)
        const GoodNFT = await ethers.getContractFactory("GoodNFT");
        gNft = await GoodNFT.connect(deployer).deploy();
        gNftAddr = await gNft.getAddress();
        console.log("GoodNft deployed at:", gNftAddr);
    
        // Deploy BadNFT (Mock NFT contract)
        const BadNFT = await ethers.getContractFactory("BadNFT");
        bNft = await BadNFT.connect(deployer).deploy();
        bNftAddr = await bNft.getAddress();
        console.log("BadNft deployed at:", bNftAddr);

        // Deploy Addresses
        const Addresses = await ethers.getContractFactory("Addresses");
        addresses = await Addresses.connect(deployer).deploy();
        addressesAddr = await addresses.getAddress();
        console.log("UserPortal deployed at:", addressesAddr);
    
        // Deploy MockOracle contract
        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.connect(deployer).deploy(addressesAddr);
        mockOracleAddr = await mockOracle.getAddress();
        console.log("MockOracle deployed at:", mockOracleAddr);

        // Deploy DynamicInterestModel contract
        const DynamicInterestModel = await ethers.getContractFactory("DynamicInterestModel");
        dim = await DynamicInterestModel.connect(deployer).deploy(addressesAddr);
        dimAddr = await dim.getAddress();
        console.log("DynamicInterestModel deployed at:", dimAddr);
    
        // Deploy UserPortal
        const UserPortal = await ethers.getContractFactory("UserPortal");
        portal = await UserPortal.connect(deployer).deploy(addressesAddr);
        portalAddr = await portal.getAddress();
        console.log("UserPortal deployed at:", portalAddr);
    
        // Deploy LendingPool
        const LendingPool = await ethers.getContractFactory("LendingPool");
        lendingPool = await LendingPool.connect(deployer).deploy(addressesAddr);
        lendingPoolAddr = await lendingPool.getAddress();
        console.log("LendingPool deployed at:", lendingPoolAddr);
    
        // Deploy CollateralManager
        const CollateralManager = await ethers.getContractFactory("CollateralManager");
        collateralManager = await CollateralManager.connect(deployer).deploy(addressesAddr);
        collateralManagerAddr = await collateralManager.getAddress();
        console.log("CollateralManager deployed at:", collateralManagerAddr);
    
        // Deploy NftTrader
        const NftTrader = await ethers.getContractFactory("NftTrader");
        nftTrader = await NftTrader.connect(deployer).deploy(addressesAddr);
        nftTraderAddr = await nftTrader.getAddress();
        console.log("NftTrader deployed at:", nftTraderAddr);
    
        // Deploy NftValues
        const NftValues = await ethers.getContractFactory("NftValues");
        nftValues = await NftValues.connect(deployer).deploy(addressesAddr);
        nftValuesAddr = await nftValues.getAddress();
        console.log("NftValues deployed at:", nftValuesAddr);

        await addresses.connect(deployer).setAddress("GoodNft", gNftAddr);
        await addresses.connect(deployer).setAddress("BadNft", bNftAddr);
        await addresses.connect(deployer).setAddress("Addresses", addressesAddr);
        await addresses.connect(deployer).setAddress("NftValues", nftValuesAddr);
        await addresses.connect(deployer).setAddress("CollateralManager", collateralManagerAddr);
        await addresses.connect(deployer).setAddress("NftTrader", nftTraderAddr);
        await addresses.connect(deployer).setAddress("LendingPool", lendingPoolAddr);
        await addresses.connect(deployer).setAddress("UserPortal", portalAddr);
        await addresses.connect(deployer).setAddress("DynamicInterestModel", dimAddr);
        await addresses.connect(deployer).setAddress("MockOracle", mockOracleAddr);
        await addresses.connect(deployer).setAddress("deployer", deployer.address);
    
        // Initialize contracts
        // Initialize MockOracle
        await mockOracle.connect(deployer).initialize();
    
        // Initialize NftValues
        await nftValues.connect(deployer).initialize(useOnChainOracle);
    
        // Initialize CollateralManager
        await collateralManager.connect(deployer).initialize();

        // Initialize DynamicInterestModel
        baseRate = 500;
        multiplierPreKink = 500;
        multiplierPostKink = 2000;
        optimalUtilization = 8000;
        reserveFactor = 1000;
        liquidityCeiling = 9500;
        maxBorrowRate = 5000;
        await dim.connect(deployer).initialize(baseRate, multiplierPreKink, multiplierPostKink, optimalUtilization, reserveFactor, liquidityCeiling, maxBorrowRate);
        console.log("DynamicInterestModel initialized!");
        // Initialize NftTrader
        await nftTrader.connect(deployer).initialize();
    
        // Initialize LendingPool
        await lendingPool.connect(deployer).initialize();
    
        // Initialize UserPortal
        await portal.connect(deployer).initialize();
        console.log("All contracts initialized!");

        // Set initial collection prices in MockOracle
        gNftFP = parseEther("10"); // 10 ETH floor price
        console.log("Setting price for GoodNft collection token 0 to ...", gNftFP.toString());
        await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 0, gNftFP);

        await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 1, gNftFP);
        
        bNftFP = parseEther("15"); // 15 ETH floor price
        console.log("Setting price for BadNft token 0 to ...", bNftFP.toString());
        await mockOracle.connect(deployer).manualUpdateNftPrice(bNftAddr, 0, bNftFP);

    
        // Mint NFTs for borrower1 and borrower2
        console.log("Minting GoodNfts to borrower1 and borrower2... ");
        await gNft.connect(deployer).mint(borrower1Addr);
        await gNft.connect(deployer).mint(borrower2Addr);
        const owner0 = await gNft.ownerOf(0); //borrower1
        const owner1 = await gNft.ownerOf(1); //borrower2
        if (owner0 != borrower1Addr || owner1 != borrower2Addr) {
            throw new Error("borrower1 and borrower2 should own GoodNft tokenId 0 and 1 respectively.");
        }
    });
    //TODO
    // @RTest 1 - supply
    describe("Lender Functions", function () {
        it("should allow lender1 to supply 10 ETH to the pool", async function () {
            const lenderBalBefore = await ethers.provider.getBalance(lender1Addr);
            const amountLending = parseEther("10");
    
          // Record initial pool balance
          const initialPoolBalance = await lendingPool.getPoolBalance();
    
          // lender1 supplies ETH via portal
          await expect(
            portal.connect(lender1).supply(amountLending, { value: amountLending })
          ).to.emit(lendingPool, "Supplied").withArgs(lender1.address, amountLending);
    
          // Check pool balance
          const poolBalance = await lendingPool.getPoolBalance();
          expect(poolBalance).to.equal(initialPoolBalance + amountLending);
    
          // Check lender1's balance in LendingPool
          const lenderBalance = await lendingPool.totalSuppliedUsers(lender1.address);
          expect(lenderBalance).to.equal(amountLending);

          await expect(
            portal.connect(lender1).withdraw(amountLending)
          ).to.emit(lendingPool, "Withdrawn").withArgs(lender1Addr, amountLending);

          const lenderBalAfter = await ethers.provider.getBalance(lender1Addr);

          console.log("Lender1's balance before: ", lenderBalBefore.toString());
          console.log("Lender1's balance after: ", lenderBalAfter.toString());
        });
    });
});