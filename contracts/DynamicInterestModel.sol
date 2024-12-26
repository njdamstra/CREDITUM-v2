// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IAddresses} from "./interfaces/IAddresses.sol";
import {ICollateralManager} from "../contracts/interfaces/ICollateralManager.sol";
// import {WadRayMath} from "../libraries/math/WadRayMath.sol";
// import {PercentageMath} from "../libraries/math/PercentageMath.sol";

contract DynamicInterestModel {

    uint256 public baseRate; // Base interest rate (alpha)
    uint256 public multiplierPreKink; // Multiplier before the kink (beta)
    uint256 public multiplierPostKink; // Multiplier after the kink (gamma)
    uint256 public optimalUtilization; // Optimal utilization ratio (U*)
    uint256 public reserveFactor; // Reserve factor in basis points (e.g. 10% = 1000)
    uint256 public liquidityCeiling; // Maximum allowed utilization (e.g., 95% = 9500)
    uint256 public maxBorrowRate; // maximum allowed interest rate given to borrowers for a loan

    address public owner;
    IAddresses public addresses;
    ICollateralManager public iCollateralManager;

    constructor(address _addressesAddr) {
        owner = msg.sender;
        addresses = IAddresses(_addressesAddr);
    }

    function initialize(
        uint256 _baseRate,
        uint256 _multiplierPreKink,
        uint256 _multiplierPostKink,
        uint256 _optimalUtilization,
        uint256 _reserveFactor,
        uint256 _liquidityCeiling,
        uint256 _maxBorrowRate
    ) external onlyOwner {
        baseRate = _baseRate;
        multiplierPreKink = _multiplierPreKink;
        multiplierPostKink = _multiplierPostKink;
        optimalUtilization = _optimalUtilization; // expressed as a percentage (e.g., 80% = 8000, assuming 2 decimals)
        reserveFactor = _reserveFactor;
        liquidityCeiling = _liquidityCeiling; // e.g., 95% = 9500
        maxBorrowRate = _maxBorrowRate;
        iCollateralManager = ICollateralManager(addresses.getAddress("CollateralManger"));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "[*ERROR*] Not the contract owner!");
        _;
    }

    function adjustConstants(
        uint256 _baseRate,
        uint256 _multiplierPreKink,
        uint256 _multiplierPostKink,
        uint256 _optimalUtilization,
        uint256 _reserveFactor,
        uint256 _liquidityCeiling,
        uint256 _maxBorrowRate
        ) external onlyOwner {
            if (_baseRate != 0) {
                baseRate = _baseRate;
            }
            if (_multiplierPreKink != 0) {
                multiplierPreKink = _multiplierPreKink;
            }
            if (_multiplierPostKink != 0) {
                multiplierPostKink = _multiplierPostKink;
            }
            if (_optimalUtilization != 0) {
                optimalUtilization = _optimalUtilization;
            }
            if (_reserveFactor <= 1e4 && _reserveFactor != 0) {
                reserveFactor = _reserveFactor; // Reserve factor cannot exceed 100%
            }
            if (_liquidityCeiling <= 1e4 && _liquidityCeiling != 0) {
                liquidityCeiling = _liquidityCeiling; // Ceiling cannot exceed 100%
            }
            if (_maxBorrowRate != 0) {
                maxBorrowRate = _maxBorrowRate;
            }

        }

    /////// **VIEW FUNCTIONS** /////////

    function getConstants() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (baseRate, multiplierPreKink, multiplierPostKink, optimalUtilization, reserveFactor, liquidityCeiling);
    }

    function getCurrUtilization(uint256 totalBorrowed, uint256 totalSupplied) public view returns (uint256) {
        return _calcUtilizationRate(totalBorrowed, totalSupplied, 0, 0);
    }

    function getCurrLiquidityRate(uint256 totalBorrowed, uint256 totalSupplied) public view returns (uint256) {
        uint256 borrowRate = getCurrBorrowRate(totalBorrowed, totalSupplied);
        return _calcLiquidityRate(totalBorrowed, totalSupplied, borrowRate);
    }

    function getCurrBorrowRate(uint256 totalBorrowed, uint256 totalSupplied) public view returns (uint256) {
        return calculateBorrowRate(totalBorrowed, totalSupplied, 0);
    }

    ////// **HELPER FUNCTIONS** ////////
    function _calcUtilizationRate(
        uint256 totalBorrowed,
        uint256 totalSupplied,
        uint256 liquidityAdded,
        uint256 liquidityTaken
    ) public pure returns (uint256 utilizationRate) {
        require(totalSupplied > 0, "Total supplied must be greater than 0");

        // Calculate available liquidity after considering inflows and outflows

        utilizationRate = ((totalBorrowed + liquidityTaken) * 1e4) / (liquidityAdded + totalSupplied); // Utilization ratio scaled by 1e4
        return utilizationRate;
    }

    function _calcLiquidityRate(
        uint256 totalBorrowed,
        uint256 totalSupplied,
        uint256 borrowRate
    ) public view returns (uint256) {
            uint256 utilization = _calcUtilizationRate(totalBorrowed, totalSupplied, 0, 0);
            return borrowRate * utilization * (1e4 - reserveFactor) / 1e4;
    }

    /**
     * @dev Helper function to calculate rate when utilization is below the kink.
     * @param utilizationRate Current utilization rate (scaled by 1e4).
     * @return Calculated interest rate.
     */
    function _calcBelowKinkRate(uint256 utilizationRate) internal view returns (uint256) {
        return baseRate + (multiplierPreKink * utilizationRate) / optimalUtilization;
    }

    /**
     * @dev Helper function to calculate rate when utilization is above the kink.
     * @param utilizationRate Current utilization rate (scaled by 1e4).
     * @return Calculated interest rate.
     */
    function _calcAboveKinkRate(uint256 utilizationRate) internal view returns (uint256) {
        uint256 excessUtilization = utilizationRate - optimalUtilization;
        uint256 excessRate = (multiplierPostKink * excessUtilization) / (1e4 - optimalUtilization);
        return baseRate + multiplierPreKink + excessRate;
    }

    /**
     * @dev Applies the reserve factor to the raw interest rate.
     * @param rawRate The raw calculated interest rate.
     * @return Adjusted interest rate after applying reserve factor.
     */
    function _applyReserveFactor(uint256 rawRate) public view returns (uint256) {
        return (rawRate * (1e4 - reserveFactor)) / 1e4;
    }

    function cappedBorrowRate(uint256 rate) internal view returns (uint256) {
        return rate > maxBorrowRate ? maxBorrowRate : rate;
    }

    ///////////** MAIN CALCULATING INTEREST RATE FUNCTIONS CALLED BY POOL **////////////

    /**
     * @dev Calculates the current borrowing interest rate based on the utilization ratio.
     * @param totalBorrowed Total funds borrowed from the pool.
     * @param totalSupplied Total funds supplied to the pool.
     * @param liquidityTaken Liquidity taken during the transaction without interest.
     * @return Borrowing interest rate (scaled by 1e4 for precision).
     */
    function calculateBorrowRate(
        uint256 totalBorrowed,
        uint256 totalSupplied,
        uint256 liquidityTaken
    ) public view returns (uint256)
    {
        require(totalSupplied > 0, "Total supplied must be greater than 0");

        uint256 utilizationRate = _calcUtilizationRate(totalBorrowed, totalSupplied, 0, liquidityTaken);
        uint256 rawRate;

        if (utilizationRate <= optimalUtilization) {
            // Linear increase before kink
            rawRate = _calcBelowKinkRate(utilizationRate);
        } else {
            // Sharp/steeper increase after kink
            rawRate = _calcAboveKinkRate(utilizationRate);
        }
        return cappedBorrowRate(rawRate);
    }

    function calculateBorrowRateWithRisk(
        uint256 totalBorrowed, uint256 totalSupplied, uint256 liquidityTaken, address borrower
    ) public view returns (uint256) {
        uint256 rawRate = calculateBorrowRate(totalBorrowed, totalSupplied, liquidityTaken);
        uint256 riskWeight = iCollateralManager.getBorrowerRiskWeight(borrower);
        require(riskWeight > 0, "[*ERROR*] Invalid borrower risk weight");
        uint256 weightedRate = (rawRate * riskWeight) / 1e3; // Scale by 1e3 to apply weight
        return cappedBorrowRate(weightedRate);
    }

    /**
     * @dev Checks if the utilization exceeds the liquidity ceiling.
     * @param totalBorrowed Total funds borrowed from the pool.
     * @param totalSupplied Total funds supplied to the pool.
     * @return True if the utilization is within the ceiling; otherwise, false.
     */
    function isBelowLiquidityCeiling(uint256 totalBorrowed, uint256 totalSupplied, uint256 liquidityTaken)
        public
        view
        returns (bool)
    {
        uint256 utilization = _calcUtilizationRate(totalBorrowed, totalSupplied, 0, liquidityTaken);
        return utilization <= liquidityCeiling;
    }
}