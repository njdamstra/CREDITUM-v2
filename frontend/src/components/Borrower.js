import React, { useState } from "react";
import { getContract } from "../utils/web3";

const Borrower = () => {
    const [collection, setCollection] = useState("");
    const [tokenId, setTokenId] = useState("");
  
    const handleAddCollateral = async () => {
      const contract = await getContract("UserPortal");
      if (!contract) return;
  
      try {
        await contract.methods.addCollateral(collection, tokenId).send({
          from: (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0],
        });
        alert("Collateral added successfully!");
      } catch (error) {
        console.error("Add collateral failed:", error);
      }
    };
  
    return (
      <div>
        <h2>Borrower Dashboard</h2>
        <input
          type="text"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          placeholder="Collection Address"
        />
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID"
        />
        <button onClick={handleAddCollateral}>Add Collateral</button>
      </div>
    );
  };
  
  export default Borrower;
