import React, { useEffect, useState } from "react";
import { getListedNfts } from "../utils/contractViewing";
import { formatEther } from "ethers";
import { toast } from "react-toastify";

function MarketPlace() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListedNfts = async () => {
            try {
                const [
                    collectionAddresses,
                    tokenIds,
                    basePrices,
                    highestBids,
                    auctionStarted,
                    auctionEnds,
                    buyNow,
                  ] = await getListedNfts();
          
                  // Convert BigInt values to strings for compatibility
                  const formattedListings = collectionAddresses.map((address, index) => ({
                    collectionAddress: address,
                    tokenId: tokenIds[index].toString(), // Convert BigInt to string
                    basePrice: formatEther(basePrices[index]).toString(), // Convert BigInt to string
                    highestBid: formatEther(highestBids[index]).toString(), // Convert BigInt to string
                    auctionStarted: auctionStarted[index].toString(), // Ensure boolean type
                    auctionEnds: auctionEnds[index].toString(), // Convert BigInt to string
                    buyNow: Boolean(buyNow[index]), // Ensure boolean type
                  }));
          
                  setListings(formattedListings);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching NFT listings:", error);
                toast.error("Failed to fetch marketplace listings.");
                setLoading(false);
            }
        };
        fetchListedNfts();
    }, []);

    return (
        <div className="marketplace">
            <h2>Marketplace</h2>
            {loading ? (
                <p>Loading marketplace listings...</p>
            ) : listings.length === 0 ? (
                <p>No NFTs currently listed on the marketplace.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Collection Address</th>
                            <th>Token ID</th>
                            <th>Base Price (ETH)</th>
                            <th>Highest Bid (ETH)</th>
                            <th>Auction Started</th>
                            <th>Auction Ends</th>
                            <th>Buy Now?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((nft, index) => (
                            <tr key={index}>
                                <td>{nft.collectionAddress}</td>
                                <td>{nft.tokenId}</td>
                                <td>{nft.basePrice}</td>
                                <td>{nft.highestBid}</td>
                                <td>{nft.auctionStarted ? new Date(nft.auctionStarted * 1000).toLocaleString() : "N/A"}</td>
                                <td>{nft.auctionEnds ? new Date(nft.auctionEnds * 1000).toLocaleString() : "N/A"}</td>
                                <td>{nft.buyNow ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MarketPlace;
