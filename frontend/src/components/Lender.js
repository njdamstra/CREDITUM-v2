import React, { useState } from "react";
import { getContract } from "../utils/web3";

const Lender = () => {
  const [amount, setAmount] = useState("");
  
  const handleSupply = async () => {
    const contract = await getContract("UserPortal");
    if (!contract) return;

    try {
      await contract.methods.supply(amount).send({
        from: (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0],
        value: amount, // Ensure amount is in WEI
      });
      alert("Supply successful!");
    } catch (error) {
      console.error("Supply failed:", error);
    }
  };

  return (
    <div>
      <h2>Lender Dashboard</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in WEI"
      />
      <button onClick={handleSupply}>Supply</button>
    </div>
  );
};

export default Lender;
