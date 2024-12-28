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
    let liquidityThreshold, percent, normPerc;

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

        liquidityThreshold = ethers.toBigInt("75");
        percent = ethers.toBigInt("10000");
        normPerc = 10000;

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
    // @ITest 1
    describe("Basic Interest Rate Tests directly after initialization", function () {
        it("Should get the correct contants from DynamicInterestModel", async function () {
            const [BR, preKink, postKink, optU, RF, LC, maxBR] = await dim.connect(deployer).getConstants();

            console.log("Base Rate:", BR.toString());
            console.log("Multiplier Pre Kink:", preKink.toString());
            console.log("Multiplier Post Kink:", postKink.toString());
            console.log("Optimal Utilization Ratio:", optU.toString());
            console.log("Reserve Factor:", RF.toString());
            console.log("Liquidity Ceiling:", LC.toString());
            console.log("Max Borrow Rate:", maxBR.toString());

            expect(BR).to.equal(baseRate);
            expect(preKink).to.equal(multiplierPreKink);
            expect(postKink).to.equal(multiplierPostKink); 
            expect(optU).to.equal(optimalUtilization);
            expect(RF).to.equal(reserveFactor); 
            expect(LC).to.equal(liquidityCeiling);
            expect(maxBR).to.equal(maxBorrowRate);
        });
        it("Should let me change the constants after initialization", async function () {
            const newBR = baseRate / 2;
            const newRF = reserveFactor * 2;
            await dim.adjustConstants(newBR, 0, 0, 0, newRF, 0, 0);
            const [BR, preKink, postKink, optU, RF, LC, maxBR] = await dim.getConstants();
            console.log("Base Rate:", BR.toString());
            expect(BR).to.equal(newBR);
            console.log("Multiplier Pre Kink:", preKink.toString());
            expect(preKink).to.equal(multiplierPreKink);
            console.log("Multiplier Post Kink:", postKink.toString());
            expect(postKink).to.equal(multiplierPostKink);
            console.log("Optimal Utilization Ratio:", optU.toString());
            expect(optU).to.equal(optimalUtilization);
            console.log("Reserve Factor:", RF.toString());
            expect(RF).to.equal(newRF);
            console.log("Liquidity Ceiling:", LC.toString());
            expect(LC).to.equal(liquidityCeiling);
            console.log("Max Borrow Rate:", maxBR.toString());
            expect(maxBR).to.equal(maxBorrowRate);
        });
        it("Should provide the correct values during calcutions after initialization", async function () {
            const initialUtilRate = await dim.getCurrUtilization(0, 0);
            console.log("Calc util rate (should be 0):", initialUtilRate.toString());
            expect(initialUtilRate).to.equal(0);

            const initialBR = await dim.getCurrBorrowRate(0, 0);
            console.log("Calculated borrow rate (should equal base rate):", initialBR.toString());
            expect(initialBR).to.equal(baseRate);

            const initialLR = await dim.getCurrLiquidityRate(0, 0);
            console.log("Calculating initial Liquidity Rate (should be 0):", initialLR.toString());
            expect(initialLR).to.equal(0);
        });
        it("Should allow lenders to supply Eth in the pool and DIM should return the correct values", async function () {
            // lender1 supplies 10 ETH to the pool for liquidity
            console.log("lender1 supplied 10 Ethers");
            const amountLending = parseEther("10");
            const tx1 = await portal.connect(lender1).supply(amountLending, { value: amountLending });
            await expect(tx1).to.emit(lendingPool, "Supplied").withArgs(lender1Addr, amountLending);
            // borrower1 adds NFT GoodNft tokenId1 as collateral via portal
            console.log("Borrower1 adds collateral to his profile worth 10 Ethers");
            await gNft.connect(borrower1).setApprovalForAll(portalAddr, true);
            await portal.connect(borrower1).addCollateral(gNftAddr, 0);

            console.log("With Ether in the pool, but nothing borrowed, test DIM!");
            // retreive relevant variables from Pool
            const totSup = await lendingPool.totalSupplied();
            console.log("total supplied (should equal 10 eths):", totSup.toString());
            expect(totSup).to.equal(amountLending);
            const totBor = await lendingPool.totalBorrowed();
            console.log("total borrowed (should be 0):", totBor.toString());
            expect(totBor).to.equal(0);
            // Use retreived variables from pool to test DIM
            const UR = await dim.getCurrUtilization(totBor, totSup);
            console.log("Calc util rate (should be 0):", UR.toString());
            expect(UR).to.equal(0);
            const BR = await dim.getCurrBorrowRate(totBor, totSup);
            console.log("Calculated borrow rate (should equal base rate):", BR.toString());
            expect(BR).to.equal(baseRate);
            const LR = await dim.getCurrLiquidityRate(totBor, totSup);
            console.log("Calculating Liquidity Rate (should be 0):", LR.toString());
            expect(LR).to.equal(0);

            
        });
        it("Should calculate the correct Interest Rate for Borrower 1", async function () {
            console.log("lender1 supplied 10 Ethers");
            const amountLending = parseEther("10");
            const tx1 = await portal.connect(lender1).supply(amountLending, { value: amountLending });
            await expect(tx1).to.emit(lendingPool, "Supplied").withArgs(lender1Addr, amountLending);
            // borrower1 adds NFT GoodNft tokenId1 as collateral via portal
            console.log("Borrower1 adds collateral to his profile worth 10 Ethers");
            await gNft.connect(borrower1).setApprovalForAll(portalAddr, true);
            await portal.connect(borrower1).addCollateral(gNftAddr, 0);
            // retreive relevant variables from Pool
            const totSup = await lendingPool.totalSupplied();
            const totBor = await lendingPool.totalBorrowed();

            // Use retreived variables from pool to test DIM
            
            console.log("manually calculate the interest rate for borrower1 if he takes a loan of 5 Eth");
            const amountBorrowing = parseEther("5");
            const Borrower1IR = await dim.calculateBorrowRate(totBor, totSup);
            console.log("Borrower1's interest rate:", Borrower1IR.toString());
            expect(Borrower1IR).to.equal(baseRate);
            const expectedTotDebt = amountBorrowing + (amountBorrowing * Borrower1IR / percent);
            console.log("Expected total debt if borrower1 took out a 5 Eth loan:", expectedTotDebt.toString());

            console.log("calling borrow in Portal and listening for events");
            await expect(
                portal.connect(borrower1).borrow(amountBorrowing)
            ).to.emit(lendingPool, "Borrowed").withArgs(borrower1Addr, amountBorrowing);

            const [totalDebt, netDebt, , HF, , , ] = await portal.connect(borrower1).getBorrowerAccountData();
            console.log("Actual total debt:", totalDebt.toString());
            console.log("Net debt:", netDebt.toString());
            console.log("Health Factor:", HF.toString());
            expect(totalDebt).to.equal(expectedTotDebt);
            expect(netDebt).to.equal(amountBorrowing);

            const expectedHF = (gNftFP * liquidityThreshold) / expectedTotDebt;
            expect(HF).to.equal(expectedHF);

            // check pool data
            const totBor2 = await lendingPool.totalBorrowed();
            const totSup2 = await lendingPool.totalSupplied();
            const PB2 = await lendingPool.poolBalance();
            const expectedPB2 = totSup2 - amountBorrowing;
            console.log("total borrowed:", totBor2.toString());
            console.log("total supplied:", totSup2.toString());
            console.log("total pools balance:", PB2.toString());
            expect(totBor2).to.equal(expectedTotDebt);
            expect(totSup2).to.equal(amountLending);
            expect(PB2).to.equal(expectedPB2);

            // check DIM data:
            const currUR = await dim.getCurrUtilization(totBor2, totSup2);
            const currBR = await dim.getCurrBorrowRate(totBor2, totSup2);
            const currLR = await dim.getCurrLiquidityRate(totBor2, totSup2);
            console.log("Utilization Rate after first borrow:", currUR.toString());
            console.log("Borrow Rate after first borrow:", currBR.toString());
            console.log("Liquidity Rate after first borrow:", currLR.toString());
            const bor = ethers.formatEther(totBor2);
            const sup = ethers.formatEther(totSup2);
            const expectedUR = Math.floor((bor / sup) * normPerc);
            console.log("expected Utilization Rate", expectedUR);
            expect(currUR).to.equal(expectedUR);
            const expectedBR = Math.floor(baseRate + (expectedUR*multiplierPreKink) / optimalUtilization);
            console.log("expected Borrow Rate", expectedBR);
            expect(currBR).to.equal(expectedBR);
            const adjusted = Math.floor((expectedBR * expectedUR) / normPerc)
            const expectedLR = Math.floor(adjusted * (normPerc - reserveFactor) / normPerc);
            console.log("expected Liquidity Rate:", expectedLR);
            expect(currLR).to.equal(expectedLR)
        })
    });

    // describe("Borrower Gets a Loan Using 1 NFT as Collateral", function () {
    //     beforeEach(async function () {
    //         // lender1 supplies 10 ETH to the pool for liquidity
    //         const amountLending = parseEther("10");
    //         await portal.connect(lender1).supply(amountLending, { value: amountLending });
    //         // borrower1 adds NFT GoodNft tokenId1 as collateral via portal
    //         await gNft.connect(borrower1).setApprovalForAll(portalAddr, true);
    //         await portal.connect(borrower1).addCollateral(gNftAddr, 0);
    //     });
    //     it("Should allow borrower1 to get a loan of 5 ETH", async function () {

    //     });
    // });
});