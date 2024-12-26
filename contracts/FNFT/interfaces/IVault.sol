// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IVault {
    function depositNFT(address contractAddress, uint256 tokenId) external;
    function withdrawNFT(address contractAddress, uint256 tokenId) external;
}