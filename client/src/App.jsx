import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ConnectWalletButton from "./components/ConnectWalletButton";
import ContractInfo from "./components/ContractInfo";
import LenderActions from "./components/LenderActions"; // Placeholder for your LenderActions component
import BorrowerActions from "./components/BorrowerActions"; // Placeholder for BorrowerActions component
import LiquidatorActions from "./components/LiquidatorActions"; // Placeholder for LiquidatorActions component
import SimulateBorrower from "./components/SimulateBorrower";
import { reinitialize, requestAccount } from "./utils/contractInstances";
import { getContractBalanceInETH, getLenderSupplied, getBorrowerData } from "./utils/contractViewing";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [account, setAccount] = useState(null);
    const [poolBalance, setBalance] = useState(0);
    const [youSupplied, setSupplied] = useState(0);
    const [yourTotalDebt, setTotalDebt] = useState(0);
    const [yourNetDebt, setNetDebt] = useState(0);
    const [yourCollateralValue, setCollateralValue] = useState(0);
    const [yourHealthFactor, setHealthFactor] = useState(0);

    const refreshData = async () => {
      if (!account) {
        console.error("No account connected!");
        return;
      }
      try {
        const balanceInETH = await getContractBalanceInETH();
        const suppliedInETH = await getLenderSupplied();
        const [totalDebt, netDebt, collateralValue, healthFactor] = await getBorrowerData();
  
        setBalance(balanceInETH);
        setSupplied(suppliedInETH);
        setTotalDebt(totalDebt);
        setNetDebt(netDebt);
        setCollateralValue(collateralValue);
        setHealthFactor(healthFactor);
  
        console.log("Data refreshed successfully!");
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };
  
    useEffect(() => {
      const fetchCurAccount = async () => {
        const account = await requestAccount();
        setAccount(account);
      };
      fetchCurAccount();
    }, []);
  
    useEffect(() => {
      const handleAccountChanged = async (newAccounts) => {
        const newAccount = newAccounts.length > 0 ? newAccounts[0] : null;
        setAccount(newAccount);
        if (newAccount) {
          await reinitialize();
          refreshData(); // Automatically refresh data for the new account
        }
      };
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountChanged);
      }
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountChanged);
      };
    });

    useEffect(() => {
      if (account) {
        refreshData();
      }
    }, [account]);

    return (
        <Router>
        <div className="app">
            <ToastContainer />
            {!account ? (
                <ConnectWalletButton setAccount={setAccount} />
            ) : (
                <div className="contract-interactions">
                    <h2>Welcome to CREDITUM-v2!</h2>
                    <ContractInfo 
                      account={account}
                      poolBalance={poolBalance}
                      youSupplied={youSupplied}
                      yourTotalDebt={yourTotalDebt}
                      yourNetDebt={yourNetDebt}
                      yourCollateralValue={yourCollateralValue}
                      yourHealthFactor={yourHealthFactor}
                      refreshData={refreshData}
                    />
                    <Navbar refreshData={refreshData} />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/lender" element={<LenderActions refreshData={refreshData} />} />
                        <Route path="/borrower" element={<BorrowerActions refreshData={refreshData} />} />
                        <Route path="/liquidator" element={<LiquidatorActions refreshData={refreshData} />} />
                        <Route path="/simulateborrowing" element={<SimulateBorrower refreshData={refreshData} />} />
                    </Routes>
                </div>
            )}
        </div>
        </Router>
    );
  }

  function Navbar({ refreshData }) {
    return (
        <nav className="navbar">
            <ul>
                <li>
                    <Link to="/" onClick={refreshData}>Home</Link>
                </li>
                <li>
                    <Link to="/lender" onClick={refreshData}>Lender</Link>
                </li>
                <li>
                    <Link to="/borrower" onClick={refreshData}>Borrower</Link>
                </li>
                <li>
                    <Link to="/liquidator" onClick={refreshData}>Liquidator</Link>
                </li>
                <li>
                  <Link to="/simulateborrower" onClick={refreshData}>Simulate Borrowing</Link>
                </li>
            </ul>
        </nav>
    );
}
  
  function LandingPage() {
    return (
      <div className="landing-page">
        <h1>Select Your Role</h1>
        <ul>
          <li>
            <Link to="/lender">Lender Actions</Link>
          </li>
          <li>
            <Link to="/borrower">Borrower Actions</Link>
          </li>
          <li>
            <Link to="/liquidator">Liquidator Actions</Link>
          </li>
        </ul>
      </div>
    );
  }
  
  export default App;