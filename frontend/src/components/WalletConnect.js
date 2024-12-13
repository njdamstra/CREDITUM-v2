import React, { useState, useEffect } from "react";
import Web3 from "web3";

function WalletConnect() {
  const [account, setAccount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        setErrorMessage(""); // Clear any previous error messages
      } catch (error) {
        if (error.code === 4001) {
          // User rejected the connection
          setErrorMessage("Connection request rejected by user.");
        } else {
          setErrorMessage("Wallet connection failed. Please try again.");
          console.error("Wallet connection error:", error);
        }
      }
    } else {
      alert("MetaMask is not installed! Please install MetaMask and try again.");
    }
  };


  // Handle account change event
  const handleAccountChange = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setErrorMessage(""); // Clear any error message on successful account switch
    } else {
      setAccount("");
      setErrorMessage("No wallet account connected.");
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChange);
    }

    // Cleanup event listener on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
      }
    };
  }, []);

  return (
    <div>
      {account ? (
        <p>Connected Account: <strong>{account}</strong></p>
      ) : (
        <button className="btn btn-primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
      {errorMessage && <p className="text-danger">{errorMessage}</p>}
    </div>
  );
}

export default WalletConnect;

