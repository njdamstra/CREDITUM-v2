import UserPortal from "./contractABI/UserPortal.json";
import { BrowserProvider, Contract } from "ethers";
const deployedAddresses = require("./deployedAddresses.json");

let provider;
let signer;
let contract;
let isInitialized = false;

const initialize = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new BrowserProvider(window.ethereum);
    // provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    signer = await provider.getSigner();
    contract = new Contract(deployedAddresses.UserPortal, UserPortal, signer);
    isInitialized = true;
    console.log("Initialized contract for account:", await signer.getAddress());
  } else {
    console.error("Please install MetaMask!");
  }
};



export const reinitialize = async () => {
    isInitialized = false;
  await initialize();
};


export const getContractInstance = () => {
    if (!isInitialized) throw new Error("Contract not initialized!");
    return contract;
  };
  
  export const getProvider = () => {
    if (!isInitialized) throw new Error("Provider not initialized!");
    return provider;
  };
  
  export const getSigner = () => {
    if (!isInitialized) throw new Error("Signer not initialized!");
    return signer;
  };

  // Helper to wait for initialization
export const waitForInitialization = async () => {
    if (!isInitialized) {
      console.log("Waiting for contract initialization...");
      await initialize(); // Ensure initialization is complete
    }
};
  

export const requestAccount = async () => {
  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    // await reinitialize(); // Ensure signer updates with new account
    return accounts[0];
  } catch (error) {
    console.error("Error requesting account:", error.message);
    return null;
  }
};

// Initialize once on module load
initialize();

