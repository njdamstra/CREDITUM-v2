import React, { useState } from "react";
import { supplyFund } from "../utils/contractServices";
import { withdrawFund } from "../utils/contractServices";
import { toast } from "react-toastify";

function ContractActions() {
    const [supplyAmount, setSupplyAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const handleSupply = async () => {
        try {
            await supplyFund(supplyAmount);
        } catch (error) {
            toast.error(error?.reason);
        }
        setSupplyAmount("");
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast.error("Enter a valid amount to withdraw!");
            return;
          }
        try {
            await withdrawFund(withdrawAmount);
            setWithdrawAmount(""); // Clear input after successful withdrawal
        } catch (error) {
            toast.error(error?.reason || "Failed to withdraw funds!");
        }
    };

    return (
        <div>
        <h2>Contract Actions</h2>
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

export default ContractActions;