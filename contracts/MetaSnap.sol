// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

//import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "hardhat/console.sol";
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

contract LensHub {
    function getFollowNFT(uint256 profileId) external view returns (address) {return 0x0000000000000000000000000000000000000000;}

    function defaultProfile(address wallet) external view returns (uint256) {return 0;}

    function getProfileIdByHandle(string calldata handle) external view returns (uint256) {return 0;}
}

contract MetaSnap {

    LensHub _lensHub;
    mapping(uint256 => Giveaway[]) _giveaways;

    struct Giveaway {
        address donor;
        uint256 profileID;
        uint256 amount;
        address winner;
    }

    constructor() public {
        address watch_addr = 0x038B86d9d8FAFdd0a02ebd1A476432877b0107C8;
        _lensHub = LensHub(watch_addr);
        console.log('constructor');
        interact();
        createGiveaway(1, 12);
        console.log('constructor finsihed');
    }

    function interact() public view returns (address[] memory){
        address followNFTAddr = _lensHub.getFollowNFT(1);
        IERC721Enumerable followNFT = IERC721Enumerable(followNFTAddr);
        uint256 totalSupply = followNFT.totalSupply();
        console.log("Follower:");
        address[] memory follower = new address[](totalSupply);
        for (uint256 i = 1; i <= totalSupply; i++) {
            follower[i - 1] = followNFT.ownerOf(i);
            console.log(followNFT.ownerOf(i));
        }
        return follower;
        //defaultProfile(address wallet)
        //getHandle(uint256 profileId)
        //getProfileIdByHandle(string calldata handle)
    }

    function getFollower(uint256 profileID) public view returns (address[] memory){
        IERC721Enumerable followNFT = IERC721Enumerable(_lensHub.getFollowNFT(profileID));
        uint256 totalSupply = followNFT.totalSupply();
        address[] memory follower = new address[](totalSupply);
        for (uint256 i = 1; i <= totalSupply; i++) {
            follower[i - 1] = followNFT.ownerOf(i);
        }
        return follower;
    }

    function createGiveaway(uint256 profileID, uint256 amount) public returns (Giveaway memory) {
        console.log('createGiveaway');
        address winner = _getRandomFollowerAddress(profileID);
        console.log('createGiveaway2');
        Giveaway memory giveaway = Giveaway(msg.sender, profileID, amount, winner);
        console.log('createGiveaway3');
        _giveaways[profileID].push(giveaway);
        console.log('createGiveaway4');
        return giveaway;
    }

    function getProfileIdByHandle(string calldata handle) public view returns (uint256){
        return _lensHub.getProfileIdByHandle(handle);
    }

    function _getRandomFollowerAddress(uint256 profileID) private returns (address) {
        console.log('_getRandomFollowerAddress');
        address watch_addr = 0x038B86d9d8FAFdd0a02ebd1A476432877b0107C8;
        console.log('_getRandomFollowerAddress2');
        _lensHub = LensHub(watch_addr);
        console.log('_getRandomFollowerAddress3');
        IERC721Enumerable followNFT = IERC721Enumerable(_lensHub.getFollowNFT(profileID));
        console.log('_getRandomFollowerAddress4');
        uint256 totalSupply = followNFT.totalSupply();
        console.log('_getRandomFollowerAddress5');
        uint256 random_number = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
        console.log('_getRandomFollowerAddress6');
        console.log(random_number);
        console.log(totalSupply);
        return followNFT.ownerOf(1 + random_number % totalSupply);
    }

}
