import React, { useState } from "react";
import { supplyFund } from "../utils/contractServices";
import { withdrawFund } from "../utils/contractServices";
import { toast } from "react-toastify";

function LenderActions({ refreshData }) {
    const [supplyAmount, setSupplyAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const handleSupply = async () => {
        if (!supplyAmount || parseFloat(supplyAmount) <= 0) {
            toast.error("Enter a valid amount to supply!");
            return;
        }
        try {
            await supplyFund(supplyAmount);
            toast.success("Successfully supplied funds!");
            setSupplyAmount(""); // Clear input after successful supply
            await refreshData();
        } catch (error) {
            console.error("Supply error:", error);
            toast.error(error?.reason || "Transaction failed!");
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast.error("Enter a valid amount to withdraw!");
            return;
          }
        try {
            await withdrawFund(withdrawAmount);
            setWithdrawAmount(""); // Clear input after successful withdrawal
            await refreshData();
        } catch (error) {
            toast.error(error?.reason || "Failed to withdraw funds!");
        }
    };

    return (
        <div>
        <h2>Lender Actions</h2>
        <div>
            <input
            type="text"
            value={supplyAmount}
            onChange={(e) => setSupplyAmount(e.target.value)}
            placeholder="Amount in ETH"
            />
            <button onClick={handleSupply}>Supply Funds</button>
        </div>
        <br />
        <div>
            <input
            type="text"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount in ETH"
            />
            <button onClick={handleWithdraw}>Withdraw Funds</button>
        </div>
        </div>
    );
}

export default LenderActions;