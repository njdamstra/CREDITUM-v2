// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "hardhat/console.log";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // added for security
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./CCollateralManager.sol";
import {ICollateralManager} from "../contracts/interfaces/ICollateralManager.sol";
import {IAddresses} from "./interfaces/IAddresses.sol";
import {IDynamicInterestModel} from "./interfaces/IDynamicInterestModel.sol";


contract LendingPool is ReentrancyGuard {
    address[] public lenders;
    address[] public borrowers;
    mapping(address => uint) public borrowerIndex;
    mapping(address => uint) public lenderIndex;
    mapping(address => bool) public isBorrowerMapping;
    mapping(address => bool) public isLenderMapping;

    mapping(address => uint256) public netSuppliedUsers; // Tracks ETH (without interest) supplied by lenders
    mapping(address => uint256) public totalSuppliedUsers; // Tracks ETH (with interest) supplied by lenders
    mapping(address => uint256) public totalBorrowedUsers; // Tracks ETH (with interest) currently borrowed by users
    mapping(address => uint256) public netBorrowedUsers; // Tracks ETH (without interest) currently borrowed by borrowers

    struct InterestProfile {
        address borrower;
        uint256 periodicalInterest; // the set interest rate we have them
        uint256 initalTimeStamp; // the start of their initial loan
        uint256 lastUpdated; // last time interest was added to this users loan
        uint256 periodDuration; // how often we update the interest rate.
    }

    mapping(address => InterestProfile) public borrowersInterestProfiles;

    struct BorrowTx {
        address borrower;
        uint256 borrowTxId;
        uint256 totalDebt;
        uint256 netDebt;
        InterestProfile interest;
        uint256 timestamp;
    }
    struct BorrowerProfile {
        address borrower;
        uint256 totalDebt;
        uint256 netDebt;
        BorrowTx[] txs;
    }
    mapping(address => BorrowerProfile) public borrowerProfiles;

    struct SupplyTx {
        address lender;
        uint256 supplyTxId;
        uint256 amountSupplied;
        uint256 amountShared;
        uint256 timestamp;
    }
    struct LenderProfile {
        address lender;
        uint256 netSupplied;
        uint256 totalShare;
        SupplyTx[] txs;
    }
    mapping(address => LenderProfile) public lenderProfiles;

    uint256 public poolBalance; // Tracks current ETH in the pool
    uint256 public totalBorrowed; // Tracks current ETH borrowed including interest
    uint256 public netBorrowed; // Tracks current ETH borrowed without interest
    uint256 public totalSupplied; // Tracks current ETH supplied including interest
    uint256 public netSupplied; // Tracks current ETH supplied without interest
    uint256 public totalReserves; // Tracks the total amount of ETH in the reserves of the pool

    address public collateralManagerAddr;
    ICollateralManager public iCollateralManager; // Contract managing NFT collateral

    bool public paused = false; // pause contract

    address public owner;
    address public portal;
    address public trader;
    address public addressesAddr;
    IAddresses public addresses;
    IDynamicInterestModel public iInterest;

    constructor(address _addressesAddr) {
        owner = msg.sender;
        addressesAddr = _addressesAddr;
        addresses = IAddresses(addressesAddr);
    }

    function initialize() external onlyOwner {
        paused = false;

        portal = addresses.getAddress("UserPortal");
        trader = addresses.getAddress("NftTrader");
        collateralManagerAddr = addresses.getAddress("CollateralManager");

        iCollateralManager = ICollateralManager(collateralManagerAddr);
        iInterest = IDynamicInterestModel(addresses.getAddress("DynamicInterestModel"));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "[*ERROR*] Not the contract owner!");
        _;
    }

    modifier onlyPortal() {
        require(msg.sender == portal, "[*ERROR*] Not the contract owner!");
        _;
    }

    modifier onlyTrader() {
        require(msg.sender == trader, "[*ERROR*] Not the contract owner!");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "[*ERROR*] Contract is paused!");
        _;
    }
    // events for transparency
    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(address indexed borrower, address indexed collection, uint256 tokenId, uint256 amountRecovered);

    function isLender(address lender) public view returns (bool) {
        return isLenderMapping[lender];
    }

    function isBorrower(address borrower) public view returns (bool) {
        return isBorrowerMapping[borrower];
    }

    function getBorrowerList() public view returns (address[] memory) {
        return borrowers;
    }

    function getLenderList() public view returns (address[] memory) {
        return lenders;
    }

    function addBorrowerIfNotExists(address borrower) public {
        // require(msg.sender == address(this) || msg.sender == collateralManagerAddr, "only Pool and CM can add borrower to list");
        require(borrower != address(0), "Invalid borrower address");

        // Check if the borrower is already in the list.
        if (isBorrowerMapping[borrower]) {
            return; // Borrower already exists in the list
        }

        // Add the borrower to the list and store its index.
        borrowers.push(borrower);
        borrowerIndex[borrower] = borrowers.length;
        isBorrowerMapping[borrower] = true;
    }


    function deleteBorrower(address borrower) public {
        // require(msg.sender == address(this) || msg.sender == collateralManagerAddr, "only Pool and CM can delete borrower");
        require(borrower != address(0), "Invalid borrower address");

        uint256 indexPlusOne = borrowerIndex[borrower];
        if (indexPlusOne == 0) {
            return; // Borrower is not in the list
        }
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = borrowers.length - 1;
        if (index != lastIndex) {
            // Swap the borrower to delete with the last borrower.
            address lastBorrower = borrowers[lastIndex];
            borrowers[index] = lastBorrower;
            borrowerIndex[lastBorrower] = index + 1; // Update index for the swapped borrower
        }
        // Clean up and remove the last entry.
        borrowers.pop();
        borrowerIndex[borrower] = 0;
        delete totalBorrowedUsers[borrower];
        delete netBorrowedUsers[borrower];
        delete borrowersInterestProfiles[borrower];
        isBorrowerMapping[borrower] = false;
    }

    function addLenderIfNotExists(address lender) public {
        // require(msg.sender == address(this) || msg.sender == collateralManagerAddr, "only Pool and CM can add lender to list");
        require(lender != address(0), "Invalid lender address");

        if (isLenderMapping[lender]) {
            return; // Lender already exists in the list
        }

        // Add the lender to the list and store its index.
        lenders.push(lender);
        lenderIndex[lender] = lenders.length;
        isLenderMapping[lender] = true;
    }

    function deleteLender(address lender) public {
        // require(msg.sender == address(this) || msg.sender == collateralManagerAddr, "only Pool and CM can delete lender from list");
        require(lender != address(0), "Invalid lender address");

        uint256 indexPlusOne = lenderIndex[lender];
        if (indexPlusOne == 0) {
            return; // Borrower is not in the list
        }
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = lenders.length - 1;
        if (index != lastIndex) {
            // Swap the lender to delete with the last lender.
            address lastLender = lenders[lastIndex];
            lenders[index] = lastLender;
            lenderIndex[lastLender] = index + 1; // Update index for the swapped lender
        }

        // Clean up and remove the last entry.
        lenders.pop();
        lenderIndex[lender] = 0;
        delete totalSuppliedUsers[lender];
        isLenderMapping[lender] = false;
    }

    function transfer(uint256 amount) external payable {
        require(msg.value == amount, "[*ERROR*] Incorrect ETH amount sent!");
        require(amount > 0, "[*ERROR*] Cannot transfer zero ETH!");

        // Update the pool balance
        poolBalance += amount;
    }

    fallback() external payable {
        require(msg.value > 0, "[*ERROR*] fallback: Cannot send zero ETH!");
        poolBalance += msg.value;
    }

    receive() external payable {
        require(msg.value > 0, "[*ERROR*] receive: Cannot send zero ETH!");
        poolBalance += msg.value;
    }

    // Allows users to supply ETH to the pool
    function supply(address lender, uint256 amount) external payable onlyPortal {
        // console.log("pool.supply: lender:(${lender}), amount: ", amount)
        require(msg.value == amount, "[*ERROR*] supply: Incorrect amount of ETH supplied!");
        require(amount > 0, "[*ERROR*] supply: Cannot supply zero ETH!");
        addLenderIfNotExists(lender);
        // Update the pool balance
        poolBalance += amount;
        netSuppliedUsers[lender] += amount;
        totalSuppliedUsers[lender] += amount;
        totalSupplied += amount;
        netSupplied += amount;
        emit Supplied(lender, amount);
    }

    // Allows users to withdraw ETH from the pool
    function withdraw(address lender, uint256 amount) external nonReentrant whenNotPaused onlyPortal {
        require(amount > 0, "[*ERROR*] Cannot withdraw zero ETH!");
        require(isLender(lender), "[*ERROR*] User is not a lender");
        require(poolBalance >= amount, "[*ERROR*] Insufficient funds in pool!");
        uint256 userBalance = totalSuppliedUsers[lender];
        require(userBalance >= amount, "[*ERROR*] Insufficient funds in balance!");

        // Update the pool balance
        poolBalance -= amount;

        //update suppliedUsers
        totalSuppliedUsers[lender] -= amount;
        if (netSuppliedUsers[lender] >= amount) {
            netSuppliedUsers[lender] -= amount;
            netSupplied -= amount;
        } else {
            netSupplied -= netSuppliedUsers[lender];
            netSuppliedUsers[lender] = 0;
        }
        
        totalSupplied -= amount;

        if (totalSuppliedUsers[lender] == 0) {
            deleteLender(lender);
        }

        // Transfer the ETH to the user
        (bool success, ) = lender.call{value: amount}("");
        require(success, "[*ERROR*] Transfer failed!");
        emit Withdrawn(lender, amount);
    }

    // Allows users to borrow ETH from the pool using NFT collateral
    function borrow(address borrower, uint256 amount) external nonReentrant whenNotPaused onlyPortal {
        require(amount <= poolBalance, "[*ERROR*] Insufficient pool liquidity!");
        require(amount > 0, "[*ERROR*] Can not borrow zero ETH!");
        require(iCollateralManager.getHealthFactor(borrower) > 150, "[*ERROR*] Health factor too low to borrow more money!");
        // Check if the pool utilization is below the liquidity ceiling BEFORE the loan
        require(
            iInterest.isBelowLiquidityCeiling(totalBorrowed, totalSupplied),
            "[*ERROR*] Utilization exceeds liquidity ceiling before borrowing!"
        );
        // calculate interest as 10% of borrowed amount
        uint256 interestRate = iInterest.calculateBorrowRate(totalBorrowed, totalSupplied);
        uint256 percent = 10000;
        uint256 interest = (amount * interestRate) / percent;
        uint256 newLoan = amount + interest;
        uint256 oldTotalDebt = totalBorrowedUsers[borrower];
        uint256 newTotalDebt = oldTotalDebt + newLoan;

        // check hf for new loan
        uint256 collateralValue = iCollateralManager.getCollateralValue(borrower);
        uint256 newHealthFactor = calculateHealthFactor(newTotalDebt, collateralValue);

        require(newHealthFactor > 100, "[*ERROR*] New health factor too low to borrow more money!");

        poolBalance -= amount;
        netBorrowed += amount;

        // Check if the new utilization after borrowing is below the ceiling
        require(
            iInterest.isBelowLiquidityCeiling(totalBorrowed, totalSupplied),
            "[*ERROR*] Loan would breach liquidity ceiling!"
        );

        addBorrowerIfNotExists(borrower);
        totalBorrowedUsers[borrower] += newLoan;
        totalBorrowed += newLoan;
        netBorrowedUsers[borrower] += amount;

        InterestProfile storage iProfile = borrowersInterestProfiles[borrower];

        if (iProfile.initalTimeStamp == 0) {
            iProfile.periodicalInterest = 2; // 2 percent interest per period
            iProfile.initalTimeStamp = block.timestamp;
            iProfile.lastUpdated = iProfile.initalTimeStamp;
            iProfile.periodDuration = 30 * 24 * 60 * 60; // 30 days in seconds
        }
        updateBorrowersInterest();

        // send eth to borrower
        (bool success, ) = borrower.call{value: amount}("");
        require(success, "[*ERROR*] Transfer of debt tokens failed!");
        
        emit Borrowed(borrower, amount);
    }

    // @Helper
    function calculateHealthFactor(uint256 debtValue, uint256 collateralValue) pure public returns (uint256) {
        if (debtValue == 0 && collateralValue > 0) return type(uint256).max; // Infinite health factor if no debt
        if (debtValue == 0) {
            debtValue = 1; // this avoids zero divison
        }
        require(collateralValue <= type(uint256).max / 100, "[*ERROR*] Collateral value too high!");
        return (collateralValue * 75) / debtValue;
    }

    // Allows users to repay borrowed ETH with interest
    function repay(address borrower, uint256 amount) public payable {
        require(msg.sender == portal || msg.sender == address(this) || msg.sender == trader, "repayment needs to come from this contract or the portal");
        require(isBorrower(borrower), "[*ERROR*] No debt to repay!");
        require(amount > 0, "[*ERROR*] Contains no value");

        uint256 totalDebt = totalBorrowedUsers[borrower];
        uint256 netDebt = netBorrowedUsers[borrower];
        require(amount <= totalDebt, "[*ERROR*] Amount exceeds total debt"); // maybe get rid rid of this and include this as supply

        if (amount >= netDebt) {
            // Calculate the excess amount (interest)
            uint256 interest = amount - netDebt;
            // Clear the net debt and reduce total debt by the amount
            netBorrowedUsers[borrower] = 0;
            totalBorrowedUsers[borrower] -= amount;
            totalBorrowed -= amount;
            netBorrowed -= netDebt;

            // Allocate the interest if any
            if (interest > 0) {
                allocateInterest(interest);
            }

            if ( netBorrowedUsers[borrower] == 0 && totalBorrowedUsers[borrower] == 0) {
                deleteBorrower(borrower);
            }

        } else {
            // If the repayment is less than netDebt, only reduce netDebt
            netBorrowedUsers[borrower] -= amount;
            totalBorrowedUsers[borrower] -= amount;
            netBorrowed -= amount;
            totalBorrowed -= amount;
        }

        poolBalance += amount;

        emit Repaid(borrower, amount);
    }

    // Liquidates an NFT if the health factor drops below 1.2
    // this function is called by CM who transfers eth to Pool and this function updates LendPool accordingly
    // TODO update according to liquidate in CM
    function liquidate(address borrower, address collection, uint256 tokenId, uint256 amount) external payable onlyTrader {
        // uint256 healthFactor = collateralManager.getHealthFactor(borrower, nftId);
        // require(healthFactor < 120, "[*ERROR*] Health factor is sufficient, cannot liquidate!");
        //uint256 nftValue = iCollateralManager.getNftValue(collection);
        //TODO
        iCollateralManager.liquidateNft(borrower, collection, tokenId, amount);

        // @Felix idk how you're doing the loan pool logic
        // im to drunk to figure it out rn
        // but im sure it works
        // the amount arg is the exact amount that was transfered over to the pool
        // the nftValue variable is the floor price we used for the nft
        // the rest of this function should be
        // 1) updating how much the borrower owes
        // 2) delegating the extra profit to the lenders
        // 3) updating the total amount in the pool with everything else you didn't give to the lenders/
        // 4) love u pookie

        uint256 totalDebt = totalBorrowedUsers[borrower];

        uint256 debtReduction = amount > totalDebt ? totalDebt : amount;
        uint256 remainingDebt = totalDebt > debtReduction ? totalDebt - debtReduction : 0;


        // netBorrowedUsers[borrower] = remainingDebt;
        // totalBorrowedUsers[borrower] = remainingDebt;
        // debt is repaid with liquidated amount
        repay(borrower, debtReduction);

        emit Liquidated(borrower, collection, tokenId, amount);
    }

    // Retrieve user account data including LP and DB tokens
    function getUserAccountData(address user) public view returns (
        uint256 totalDebt,
        uint256 netDebt,
        uint256 totalSupplied,
        uint256 collateralValue,
        uint256 healthFactor
    ) {
        totalDebt = totalBorrowedUsers[user];
        netDebt = netBorrowedUsers[user];
        totalSupplied = totalSuppliedUsers[user];
        collateralValue = iCollateralManager.getCollateralValue(user);
        healthFactor = calculateHealthFactor(totalDebt, collateralValue);
        // InterestProfile memory iProfile = borrowersInterestProfiles[user];
        return (totalDebt, netDebt, totalSupplied, collateralValue, healthFactor);
    }

    function getInterestProfile(address borrower) public view returns (
        uint256 periodicalInterest,
        uint256 initalTimeStamp,
        uint256 lastUpdated,
        uint256 periodDuration
    ) {
        InterestProfile storage iProfile = borrowersInterestProfiles[borrower];
        periodicalInterest = iProfile.periodicalInterest;
        initalTimeStamp = iProfile.initalTimeStamp;
        lastUpdated = iProfile.lastUpdated;
        periodDuration = iProfile.periodDuration;
        return (periodicalInterest, initalTimeStamp, lastUpdated, periodDuration);
    }

    function allocateInterest(uint256 totalInterest) private {
        uint256 distributedInterest = iInterest.applyReserveFactor(totalInterest);
        for (uint256 i = 0; i < lenders.length; i++) {
            address lender = lenders[i];
            uint256 lenderBalance = totalSuppliedUsers[lender];
            uint256 lenderShare = (lenderBalance * distributedInterest) / totalSupplied;
            totalSuppliedUsers[lender] += lenderShare; // Update mapping with new balance
        }
        totalSupplied += totalInterest;
        totalReserves += totalInterest - distributedInterest;
    }

    function updateBorrowersInterest() public {
        uint256 interestRate = iInterest.getCurrBorrowRate(totalBorrowed, totalSupplied);
        uint256 percent = 10000;
        for (uint256 i = 0; i < borrowers.length; i++) {
            address borrower = borrowers[i];
            InterestProfile storage iProfile = borrowersInterestProfiles[borrower];
            uint256 timeNow = block.timestamp;

            // Check if the period duration has passed for the borrower
            if (iProfile.periodDuration + iProfile.lastUpdated <= timeNow) {
                // Calculate interest as 2% of the total borrowed amount
                uint256 borrowedAmount = totalBorrowedUsers[borrower];
                uint256 interest = (borrowedAmount * interestRate) / percent;
                // Update the borrowed amount by adding the calculated interest
                totalBorrowedUsers[borrower] += interest;
                totalBorrowed += interest;
                iProfile.lastUpdated = timeNow;
            }
        }
    }


    // @Helper when borrower repays all funds from a particulare borrow tx
    function _deleteTxFromBorrowerProfile(
        address borrower,
        uint256 borrowTxId
    ) internal {
        BorrowerProfile storage profile = borrowerProfiles[borrower];
        uint256 length = profile.txs.length;
        for (uint256 i = 0; i < length; i++) {
            BorrowTx storage bTx = profile.txs[i];
            if (bTx.borrowTxId == borrowTxId) {
                // Swap the last element with the current element
                profile.txs[i] = profile.txs[length - 1];
                profile.txs.pop(); // Remove the last element
                break;
            }
        }
    }
    // @Helper when lender withdraws all funds from a particular supply tx
    function _deleteTxFromLenderProfile(
        address lender,
        uint256 supplyTxId
    ) internal {
        LenderProfile storage profile = lenderProfiles[lender];
        uint256 length = profile.txs.length;
        for (uint256 i = 0; i < length; i++) {
            SupplyTx storage sTx = profile.txs[i];
            if (sTx.supplyTxId == supplyTxId) {
                // Swap the last element with the current element
                profile.txs[i] = profile.txs[length - 1];
                profile.txs.pop(); // Remove the last element
                break;
            }
        }
    }

    function getTotalBorrowedUsers(address borrower) public view returns (uint256) {
        return totalBorrowedUsers[borrower];
    }

    function getPoolBalance() external view returns (uint256) {
        return poolBalance;
    }
}
