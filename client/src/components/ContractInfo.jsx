import React, { useEffect, useState } from "react";
import { getContractBalanceInETH } from "../utils/contractServices";
import { getLenderSupplied } from "../utils/contractServices";
import { getBorrowerData } from "../utils/contractServices";

function RefreshData({ setBalance, setSupplied }) {
    const handleRefresh = async () => {
      const balanceInETH = await getContractBalanceInETH();
      const suppliedInETH = await getLenderSupplied();
      console.log("Pool Balance:", balanceInETH, "ETH");
      console.log("You Supplied:", suppliedInETH, "ETH");
      setBalance(balanceInETH);
      setSupplied(suppliedInETH);
    };
  
    return <button onClick={handleRefresh}>Refresh Data</button>;
  }

function ContractInfo({ account }) {
  const [poolBalance, setBalance] = useState(0);
  const [youSupplied, setSupplied] = useState(0);
  const [yourTotalDebt, setTotalDebt] = useState(0);
  const [yourNetDebt, setNetDebt] = useState(0);
  const [yourCollateralValue, setCollateralValue] = useState(0);
  const [yourHealthFactor, setHealthFactor] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const balanceInETH = await getContractBalanceInETH();
      setBalance(balanceInETH);
    };
    fetchBalance();
  }, [account]);

  useEffect(() => {
    const fetchSupplied = async () => {
      const suppliedInETH = await getLenderSupplied();
      setSupplied(suppliedInETH);
    };
    fetchSupplied();
  }, [account]);

  useEffect(() => {
    const fetchBorrowerData = async () => {
      const [totalDebt, netDebt, CV, HF] = await getBorrowerData();
      setTotalDebt(totalDebt);
      setNetDebt(netDebt);
      setCollateralValue(CV);
      setHealthFactor(HF);
    };
    fetchBorrowerData();
  }, [account]);

  return (
    <div>
      <h2>Total Balance in Lending Pool: {poolBalance} ETH</h2>
      <p>Connected Account: {account}</p>
      <h2>Total amount you supplied: {youSupplied} ETH</h2>
      <h2>Total Debt you owe: {yourTotalDebt} ETH</h2>
      <h2>Net Debt you owe: {yourNetDebt} ETH</h2>
      <h2>Your Total Collaterals Value: {yourCollateralValue} ETH</h2>
      <h2>Your loans Health Factor: {yourHealthFactor} ETH</h2>
      <RefreshData setBalance={setBalance} setSupplied={setSupplied} />
    </div>
  );
}

export default ContractInfo;