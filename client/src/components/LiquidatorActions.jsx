import React, { useState } from "react";
import { placeBid, purchaseNft } from "../utils/contractServices";
import { toast } from "react-toastify";

function LiquidatorActions() {
  const [collectionAddress, setCollectionAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  // Place Bid Handler
  const handlePlaceBid = async () => {
    if (!collectionAddress || !tokenId || !bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error("Enter valid collection address, token ID, and bid amount!");
      return;
    }
    try {
      await placeBid(collectionAddress, tokenId, bidAmount);
      toast.success("Bid placed successfully!");
      setCollectionAddress("");
      setTokenId("");
      setBidAmount("");
    } catch (error) {
      toast.error(error?.reason || "Failed to place bid!");
    }
  };

  // Purchase NFT Handler
  const handlePurchase = async () => {
    if (!collectionAddress || !tokenId || !purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      toast.error("Enter valid collection address, token ID, and purchase amount!");
      return;
    }
    try {
      await purchaseNft(collectionAddress, tokenId, purchaseAmount);
      toast.success("NFT purchased successfully!");
      setCollectionAddress("");
      setTokenId("");
      setPurchaseAmount("");
    } catch (error) {
      toast.error(error?.reason || "Failed to purchase NFT!");
    }
  };

  return (
    <div>
      <h2>Liquidator Actions</h2>

      {/* Place Bid */}
      <div>
        <h3>Place Bid</h3>
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
        <input
          type="text"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder="Bid Amount in ETH"
        />
        <button onClick={handlePlaceBid}>Place Bid</button>
      </div>
      <br />

      {/* Purchase NFT */}
      <div>
        <h3>Purchase NFT</h3>
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
        <input
          type="text"
          value={purchaseAmount}
          onChange={(e) => setPurchaseAmount(e.target.value)}
          placeholder="Purchase Amount in ETH"
        />
        <button onClick={handlePurchase}>Purchase NFT</button>
      </div>
    </div>
  );
}

export default LiquidatorActions;
