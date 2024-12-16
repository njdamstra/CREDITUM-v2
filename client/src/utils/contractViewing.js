import { parseEther, formatEther, ConstructorFragment } from "ethers";
import { getContractInstance, getProvider } from "./contractInstances";

const deployedAddresses = require("./deployedAddresses.json");
// import UserPortal from "./contractABI/UserPortal.json";
// import { BrowserProvider, Contract, parseEther, formatEther, ConstructorFragment } from "ethers";
// import { CONTRACT_ADDRESS } from "./constants";


// Module-level variables to store provider, signer, and contract
// const contract = getContractInstance();
// const provider = getProvider();


// Function to get contract balance in ETH
export const getContractBalanceInETH = async () => {
    
    const provider = getProvider();
  const balanceWei = await provider.getBalance(deployedAddresses.CLendingPool, "latest");
  const balanceEth = formatEther(balanceWei); // Convert Wei to ETH string
  return balanceEth; // Convert ETH string to number
};

// Function to get contract balance in ETH
export const getLenderSupplied = async () => {
    try {
        const contract = getContractInstance();
        const suppliedWei = await contract.getLenderAccountData();
        const suppliedEth = formatEther(suppliedWei);
        return suppliedEth;
      } catch (error) {
        console.error("Error fetching lender data:", error.message);
        return 0;
      }
  };
export const getBorrowerData = async () => {
  try {
        const contract = getContractInstance();
      const [totalDebtWei, netDebtWei, collateralValueWei, healthFactor, , , ] = await contract.getBorrowerAccountData();
      const totalDebtEth = formatEther(totalDebtWei);
      const netDebtEth = formatEther(netDebtWei);
      const collateralValueEth = formatEther(collateralValueWei);
      return [totalDebtEth, netDebtEth, collateralValueEth, healthFactor];
    } catch (error) {
      console.error("Error fetching borrower data:", error.message);
      return [0, 0, 0, 0];
    };
};

export const getBorrowersCollateral = async (borrowerAddress) => {
    try {
        const contract = getContractInstance();
        const [collectionAddresses, tokenIds, values, beingLiquidatedList] = await contract.getCollateralProfile(borrowerAddress);
        const valuesEth = [];
        for (let i = 0; i < values.length; i++) {
            valuesEth[i] = formatEther(values[i]);
        }
        return [collectionAddresses, tokenIds, valuesEth, beingLiquidatedList];
    } catch (error) {
        console.error("Error fetching Borrowers Nfts:", error.message);
        return [0, 0, 0, 0];
    };
}

export const getListedNfts = async () => {
  try {
    const contract = getContractInstance();

    const [collectionAddresses, tokenIds] = await contract.getListings();
    const basePrice = [];
    const auctionStarted = [];
    const auctionEnds = [];
    const highestBid = [];
    const buyNow = [];
    for (let i = 0; i < collectionAddresses.length; i++) {
      [basePrice[i], auctionStarted[i], auctionEnds[i], highestBid[i], buyNow[i]] = await contract.getListingData(collectionAddresses[i], tokenIds[i]);
    }
    return [collectionAddresses, tokenIds, basePrice, highestBid, auctionStarted, auctionEnds, buyNow];
  } catch (error) {
    console.error("error fetching nft listings");
    return [0, 0, 0, 0, 0, 0, 0];
  };
};

// export const getListingData = async (collectionAddress, tokenId) => {
//   try {
//     const contract = getContractInstance();
//   }
// }

export const refresh = async () => {
    const contract = getContractInstance();
  const refreshTx = await contract.refresh();
  await refreshTx.wait();
  console.log("CS: refreshed contracts successfully!");
};