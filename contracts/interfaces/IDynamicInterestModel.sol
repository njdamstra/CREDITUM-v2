// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDynamicInterestModel {
    function calculateBorrowRate(uint256 totalBorrowed, uint256 totalSupplied) external view returns (uint256);
    function calculateBorrowRateAfterBorrowed(
        uint256 totalBorrowed, uint256 totalSupplied, uint256 liquidityTaken) external view returns (uint256);
    function getCurrBorrowRate(uint256 totalBorrowed, uint256 totalSupplied) external view returns (uint256);
    function isBelowLiquidityCeiling(uint256 totalBorrowed, uint256 totalSupplied)
        external
        view
        returns (bool);

    function applyReserveFactor(uint256 rawRate) external view returns (uint256);

    function getConstants() external view returns (
        uint256 baseRate,
        uint256 multiplierPreKink,
        uint256 multiplierPostKink,
        uint256 optimalUtilization,
        uint256 reserveFactor,
        uint256 liquidityCeiling,
        uint256 maxBorrowRate
    );
    function getCurrUtilization(uint256 totalBorrowed, uint256 totalSupplied) external view returns (uint256);
    function getCurrLiquidityRate(uint256 totalBorrowed, uint256 totalSupplied) external view returns (uint256);

}