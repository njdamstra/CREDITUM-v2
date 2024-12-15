import React, { useState } from "react";
import { addCollateral, borrowFund, repayDebt, redeemCollateral } from "../utils/contractServices";
import { toast } from "react-toastify";

function BorrowerActions() {
  const [collectionAddress, setCollectionAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [redeemTokenId, setRedeemTokenId] = useState("");
  const [redeemCollectionAddress, setRedeemCollectionAddress] = useState("");

  // Add Collateral Handler
  const handleAddCollateral = async () => {
    if (!collectionAddress || !tokenId) {
      toast.error("Enter a valid collection address and token ID!");
      return;
    }
    try {
      await addCollateral(collectionAddress, tokenId);
      toast.success("Collateral added successfully!");
      setCollectionAddress("");
      setTokenId("");
    } catch (error) {
      toast.error(error?.reason || "Failed to add collateral!");
    }
  };

  // Borrow Funds Handler
  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      toast.error("Enter a valid amount to borrow!");
      return;
    }
    try {
      await borrowFund(borrowAmount);
      toast.success("Borrowed funds successfully!");
      setBorrowAmount("");
    } catch (error) {
      toast.error(error?.reason || "Failed to borrow funds!");
    }
  };

  // Repay Debt Handler
  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast.error("Enter a valid amount to repay!");
      return;
    }
    try {
      await repayDebt(repayAmount);
      toast.success("Repayed debt successfully!");
      setRepayAmount("");
    } catch (error) {
      toast.error(error?.reason || "Failed to repay debt!");
    }
  };

  // Redeem Collateral Handler
  const handleRedeemCollateral = async () => {
    if (!redeemCollectionAddress || !redeemTokenId) {
      toast.error("Enter a valid collection address and token ID to redeem!");
      return;
    }
    try {
      await redeemCollateral(redeemCollectionAddress, redeemTokenId);
      toast.success("Redeemed collateral successfully!");
      setRedeemCollectionAddress("");
      setRedeemTokenId("");
    } catch (error) {
      toast.error(error?.reason || "Failed to redeem collateral!");
    }
  };

  return (
    <div>
      <h2>Borrower Actions</h2>

      {/* Add Collateral */}
      <div>
        <h3>Add Collateral</h3>
        <input
          type="text"
          value={collectionAddress}
          onChange={(e) => setCollectionAddress(e.target.value)}
          placeholder="Collection Address"
        />
        <input
          type="text"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID"
        />
        <button onClick={handleAddCollateral}>Add Collateral</button>
      </div>
      <br />

      {/* Borrow Funds */}
      <div>
        <h3>Borrow Funds</h3>
        <input
          type="text"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          placeholder="Amount in ETH"
        />
        <button onClick={handleBorrow}>Borrow Funds</button>
      </div>
      <br />

      {/* Repay Debt */}
      <div>
        <h3>Repay Debt</h3>
        <input
          type="text"
          value={repayAmount}
          onChange={(e) => setRepayAmount(e.target.value)}
          placeholder="Amount in ETH"
        />
        <button onClick={handleRepay}>Repay Debt</button>
      </div>
      <br />

      {/* Redeem Collateral */}
      <div>
        <h3>Redeem Collateral</h3>
        <input
          type="text"
          value={redeemCollectionAddress}
          onChange={(e) => setRedeemCollectionAddress(e.target.value)}
          placeholder="Collection Address"
        />
        <input
          type="text"
          value={redeemTokenId}
          onChange={(e) => setRedeemTokenId(e.target.value)}
          placeholder="Token ID"
        />
        <button onClick={handleRedeemCollateral}>Redeem Collateral</button>
      </div>
    </div>
  );
}

export default BorrowerActions;
