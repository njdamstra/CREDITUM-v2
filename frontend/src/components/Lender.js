import React, { useState } from "react";
import { getContract } from "../utils/web3";

const Lender = () => {
  const [amount, setAmount] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  const handleSupply = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setAlert({ type: "error", message: "Please enter a valid amount in WEI!" });
      return;
    }

    const contract = await getContract("UserPortal");
    if (!contract) {
      setAlert({ type: "error", message: "Failed to load contract!" });
      return;
    }

    try {
      await contract.methods.supply(amount).send({
        from: (await window.ethereum.request({ method: "eth_requestAccounts" }))[0],
        value: amount, // Ensure the amount is in WEI
      });
      setAlert({ type: "success", message: "Supply successful!" });
      setAmount(""); // Reset the input field
    } catch (error) {
      console.error("Supply failed:", error);
      setAlert({ type: "error", message: "Supply failed. Please try again." });
    }
  };

  return (
    <div>
      <h2>Lender Dashboard</h2>
      {alert.message && (
        <div
          style={{
            padding: "10px",
            margin: "10px 0",
            color: alert.type === "success" ? "green" : "red",
            border: `1px solid ${alert.type === "success" ? "green" : "red"}`,
            borderRadius: "5px",
          }}
        >
          {alert.message}
        </div>
      )}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in WEI"
        style={{ marginRight: "10px", padding: "5px" }}
      />
      <button onClick={handleSupply} style={{ padding: "5px 10px" }}>
        Supply
      </button>
    </div>
  );
};

export default Lender;
