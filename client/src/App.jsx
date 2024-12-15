import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ConnectWalletButton from "./components/ConnectWalletButton";
import ContractInfo from "./components/ContractInfo";
import LenderActions from "./components/LenderActions"; // Placeholder for your LenderActions component
import BorrowerActions from "./components/BorrowerActions"; // Placeholder for BorrowerActions component
import LiquidatorActions from "./components/LiquidatorActions"; // Placeholder for LiquidatorActions component
import { requestAccount } from "./utils/contractServices";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [account, setAccount] = useState(null);
  
    useEffect(() => {
      const fetchCurAccount = async () => {
        const account = await requestAccount();
        setAccount(account);
      };
      fetchCurAccount();
    }, []);
  
    useEffect(() => {
      const handleAccountChanged = (newAccounts) =>
        setAccount(newAccounts.length > 0 ? newAccounts[0] : null);
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountChanged);
      }
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountChanged);
      };
    });

    return (
        <Router>
        <div className="app">
            <ToastContainer />
            {!account ? (
                <ConnectWalletButton setAccount={setAccount} />
            ) : (
                <div className="contract-interactions">
                    <ContractInfo account={account} />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/lender" element={<LenderActions />} />
                        <Route path="/borrower" element={<BorrowerActions />} />
                        <Route path="/liquidator" element={<LiquidatorActions />} />
                    </Routes>
                </div>
            )}
        </div>
        </Router>
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