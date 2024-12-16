const deployedAddresses = require("./localDeployedAddresses.json");
const { loadWallets } = require("./loadWallets");
const { ethers } = require("hardhat");
const { parseEther } = ethers;


async function main () {
    const wallets = loadWallets();
    const deployer = wallets["deployer"];
    const borrower1 = wallets["borrower1"];
    console.log("deployers address:", deployer.address);
    console.log("borrower1's address:", borrower1.address);
    // const provider = ethers.provider;


    const gNftAddr = deployedAddresses.GoodNft;
    const bNftAddr = deployedAddresses.BadNft;

    

    console.log("loading contract instances of MockOracle, GoodNft, and BadNft");

    const mockOracle = await ethers.getContractAt("MockOracle", deployedAddresses.MockOracle);
    const gNft = await ethers.getContractAt("GoodNFT", gNftAddr, deployer);
    const bNft = await ethers.getContractAt("BadNFT", bNftAddr, deployer);

    gNftFP = parseEther("4"); // 10 ETH floor price
    console.log("Setting price for GoodNft collection token 0 to ...", gNftFP.toString());
    await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 0, gNftFP);
    // await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 1, gNftFP);

    // bNftFP = parseEther("15"); // 15 ETH floor price
    // console.log("Setting price for BadNft token 0 to ...", bNftFP.toString());
    // await mockOracle.connect(deployer).manualUpdateNftPrice(bNftAddr, 0, bNftFP);
    // await mockOracle.connect(deployer).manualUpdateNftPrice(bNftAddr, 1, bNftFP);

    // const userPortalAddr = deployedAddresses.UserPortal; // Replace with the actual address

    // console.log("Approving UserPortal contract for GoodNFT and BadNFT tokens...");
    // await gNft.connect(borrower1).setApprovalForAll(userPortalAddr, true);
    // await bNft.connect(borrower1).setApprovalForAll(userPortalAddr, true);
    // await gNft.connect(borrower1).approve(userPortalAddr, 0); // Approve GoodNFT token #0
    // await gNft.connect(borrower1).approve(userPortalAddr, 1); // Approve GoodNFT token #1
    // await bNft.connect(borrower1).approve(userPortalAddr, 0); // Approve BadNFT token #0
    // await bNft.connect(borrower1).approve(userPortalAddr, 1); // Approve BadNFT token #1



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });