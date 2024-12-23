// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDynamicInterestModel {
    function calculateBorrowRate(uint256 totalBorrowed, uint256 totalSupplied) external view returns (uint256);
    function isBelowLiquidityCeiling(uint256 totalBorrowed, uint256 totalSupplied)
        external
        view
        returns (bool);

    function applyReserveFactor(uint256 rawRate) public view returns (uint256);
}