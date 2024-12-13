import React, { useState } from "react";
import { Web3 } from "web3";

function WalletConnect() {
  const [account, setAccount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };

  return (
    <div>
      {account ? (
        <p>Connected Account: {account}</p>
      ) : (
        <button className="btn btn-primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
