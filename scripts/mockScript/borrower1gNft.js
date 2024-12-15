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

    console.log("verify gNftAddr points to contract address:", gNftAddr);
    console.log("GoodNFT ABI methods:", gNft.interface.functions);
    
    console.log("Minting GoodNfts tokens 0 and 1 and BadNfts tokens 0 and 1 to borrower1... ");
    const mint0tx = await gNft.connect(deployer).mint(borrower1.address); // gNft #0
    await mint0tx.wait();
    await gNft.connect(deployer).mint(borrower1.address); // gNft #1
    await bNft.connect(deployer).mint(borrower1.address); // bNft #0
    await bNft.connect(deployer).mint(borrower1.address); // bNft #1

    const owner = await gNft.ownerOf(0);
    console.log("retreived owner!");
    if (owner != borrower1.address) {
        console.log("Owner of gNft tokenId 0 isn't borrower1");
    }
    console.log("Owner of gNft tokenId 0 is borrower1");
    console.log("Owner of gNft tokenId 0:", owner.toString());
    const approvedAddress = await gNft.getApproved(0);
    console.log("Approved Address for tokenId 0:", approvedAddress);
    gNftFP = parseEther("10"); // 10 ETH floor price
    console.log("Setting price for GoodNft collection token 0 to ...", gNftFP.toString());
    await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 0, gNftFP);
    await mockOracle.connect(deployer).manualUpdateNftPrice(gNftAddr, 1, gNftFP);

    bNftFP = parseEther("15"); // 15 ETH floor price
    console.log("Setting price for BadNft token 0 to ...", bNftFP.toString());
    await mockOracle.connect(deployer).manualUpdateNftPrice(bNftAddr, 0, bNftFP);
    await mockOracle.connect(deployer).manualUpdateNftPrice(bNftAddr, 1, bNftFP);

    const userPortalAddr = deployedAddresses.UserPortal; // Replace with the actual address

    console.log("Approving UserPortal contract for GoodNFT and BadNFT tokens...");
    await gNft.connect(borrower1).setApprovalForAll(userPortalAddr, true);
    await bNft.connect(borrower1).setApprovalForAll(userPortalAddr, true);
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