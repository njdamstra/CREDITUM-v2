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
  const ethValue = parseEther(supplyAmount);
  const supply = await contract.supply(ethValue, { value: ethValue });
  await supply.wait();
  console.log("Lender supplied to pool successfully!");
};

export const withdrawFund = async (withdrawAmount) => {
    const ethValue = parseEther(withdrawAmount);
    const withdrawTx = await contract.withdraw(ethValue);
    await withdrawTx.wait();
    console.log("Lender withdrawed successfully!");
  };

export const addCollateral = async (collectionAddress, tokenId) => {
    const addCollateralTx = await contract.addCollateral(collectionAddress, tokenId);
    await addCollateralTx.wait();
    console.log("collateral added successfully!");
};

export const borrowFund = async (borrowAmount) => {
    const borrowTx = await contract.borrow(borrowAmount);
    await borrowTx.wait();
    console.log("borrowed funds successfully!");
};