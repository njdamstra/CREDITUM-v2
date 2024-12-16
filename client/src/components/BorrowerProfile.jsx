import React, { useEffect, useState } from "react";
import { getBorrowersCollateral } from "../utils/contractViewing";
import { requestAccount } from "../utils/contractInstances"; // Ensure account fetching
import { toast } from "react-toastify";

function BorrowerProfile() {
    const [collaterals, setCollaterals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBorrowerCollateral = async () => {
            try {
                const account = await requestAccount();
                if (!account) {
                    toast.error("Failed to fetch account. Please connect your wallet.");
                    return;
                }

                const [collectionAddresses, tokenIds, values, beingLiquidatedList] = await getBorrowersCollateral(account);

                // Combine the data into an array of objects for easier mapping
                const collateralData = collectionAddresses.map((address, index) => ({
                    collectionAddress: address,
                    tokenId: tokenIds[index],
                    value: values[index],
                    beingLiquidated: beingLiquidatedList[index],
                }));

                setCollaterals(collateralData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching borrower collateral:", error);
                toast.error("Failed to fetch borrower collateral.");
                setLoading(false);
            }
        };
    fetchBorrowerCollateral();
    }, []);

    return (
        <div className="borrower-profile">
            <h2>Borrower Profile</h2>
            {loading ? (
                <p>Loading collateral data...</p>
            ) : collaterals.length === 0 ? (
                <p>No NFTs found in your collateral profile.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Collection Address</th>
                            <th>Token ID</th>
                            <th>Value (ETH)</th>
                            <th>Liquidation Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collaterals.map((collateral, index) => (
                            <tr key={index}>
                                <td>{collateral.collectionAddress}</td>
                                <td>{collateral.tokenId}</td>
                                <td>{collateral.value}</td>
                                <td>{collateral.beingLiquidated ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
export default BorrowerProfile;