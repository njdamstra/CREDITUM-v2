import UserPortal from "./contractABI/UserPortal.json";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
// eslint-disable-next-line
import { CONTRACT_ADDRESS } from "./constants";
const deployedAddresses = require("./deployedAddresses.json");

// Module-level variables to store provider, signer, and contract
let provider;
let signer;
let contract;

// Function to initialize the provider, signer, and contract
const initialize = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new Contract(deployedAddresses.UserPortal, UserPortal, signer);
  } else {
    console.error("Please install MetaMask!");
  }
};

// Initialize once when the module is loaded
initialize();

// Function to request single account
export const requestAccount = async () => {
  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    return accounts[0]; // Return the first account
  } catch (error) {
    console.error("Error requesting account:", error.message);
    return null;
  }
};
// Function to get contract balance in ETH
export const getContractBalanceInETH = async () => {
  const balanceWei = await provider.getBalance(deployedAddresses.CLendingPool);
  const balanceEth = formatEther(balanceWei); // Convert Wei to ETH string
  return balanceEth; // Convert ETH string to number
};

// Function to get contract balance in ETH
export const getLenderSupplied = async () => {
    try {
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
        const [totalDebtWei, netDebtWei, collateralValueWei, healthFactor, , , ] = await contract.getBorrowerAccountData();
        const totalDebtEth = formatEther(totalDebtWei);
        const netDebtEth = formatEther(netDebtWei);
        const collateralValueEth = formatEther(collateralValueWei);
        return [totalDebtEth, netDebtEth, collateralValueEth, healthFactor];
      } catch (error) {
        console.error("Error fetching borrower data:", error.message);
        return [0, 0, 0, 0];
      }
  };

// Function to supply funds to the contract
export const supplyFund = async (supplyAmount) => {

    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    
    const ethValue = parseEther(supplyAmount);

    // const address = await signer.getAddress();

    // Fetch the current nonce from the blockchain
    // const nonce = await provider.getTransactionCount(address, "latest");
    const supply = await contract.supply(ethValue, { value: ethValue });
    await supply.wait();
    console.log("CS: Lender supplied to pool successfully!");
};

export const withdrawFund = async (withdrawAmount) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    const ethValue = parseEther(withdrawAmount);
    const withdrawTx = await contract.withdraw(ethValue);
    await withdrawTx.wait();
    console.log("CS: Lender withdrawed successfully!");
  };

export const addCollateral = async (collectionAddress, tokenId) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    const addCollateralTx = await contract.addCollateral(collectionAddress, tokenId);
    await addCollateralTx.wait();
    console.log("CS: collateral added successfully!");
};

export const borrowFund = async (borrowAmount) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    const ethValue = parseEther(borrowAmount);
    const borrowTx = await contract.borrow(ethValue);
    await borrowTx.wait();
    console.log("CS: borrowed funds successfully!");
};

export const repayDebt = async (repayAmount) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    // const address = await signer.getAddress();

    // Fetch the current nonce from the blockchain
    // const nonce = await provider.getTransactionCount(address, "latest");
    const ethValue = parseEther(repayAmount);
    const repayTx = await contract.repay(ethValue, { value: ethValue });
    await repayTx.wait();
    console.log("CS: repayed debts successfully!");
}

export const redeemCollateral = async (collectionAddress, tokenId) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    const redeemTx = await contract.redeemCollateral(collectionAddress, tokenId);
    await redeemTx.wait();
    console.log("CS: redeemed collateral successfully!");
}

export const placeBid = async (collectionAddress, tokenId, bidAmount) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    // const address = await signer.getAddress();

    // Fetch the current nonce from the blockchain
    // const nonce = await provider.getTransactionCount(address, "latest");
    const ethValue = parseEther(bidAmount);
    const bidTx = await contract.placeBid(collectionAddress, tokenId, ethValue, { value: ethValue });
    await bidTx.wait();
    console.log("CS: placed bid successfully!");
}

export const purchaseNft = async (collectionAddress, tokenId, amount) => {
    if (!provider || !signer) {
        console.error("Provider or signer is not initialized!");
        return;
    }
    // const address = await signer.getAddress();

    // Fetch the current nonce from the blockchain
    // const nonce = await provider.getTransactionCount(address, "latest");
    const ethValue = parseEther(amount);
    const purchaseTx = await contract.purchase(collectionAddress, tokenId, ethValue, { value: ethValue });
    await purchaseTx.wait();
    console.log("CS: purchased NFT successfully!");
}