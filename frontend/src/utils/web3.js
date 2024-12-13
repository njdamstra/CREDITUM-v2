import { Web3 } from "web3";
import deployedAddresses from '../deployedAddresses.json';
import UserPortalABI from '../contractABI/UserPortal.json';

const getWeb3 = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable(); // Request account access if needed
      return web3;
    } else {
      console.error("No Ethereum browser extension detected");
      return null;
    }
  };
  
  const getContract = async (contractName) => {
    const web3 = await getWeb3();
    if (!web3) return null;
  
    const address = deployedAddresses[contractName];
    const abi = contractName === 'UserPortal' ? UserPortalABI : null; // Add other contract ABIs if needed
  
    return new web3.eth.Contract(abi, address);
  };
  
  export { getWeb3, getContract };
