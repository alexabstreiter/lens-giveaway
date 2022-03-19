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

    event SendPrize(address indexed _from, address indexed _to, uint256 _value);

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
    }

    function getFollower(uint256 profileID) public view returns (address[] memory follower){
        IERC721Enumerable followNFT = IERC721Enumerable(_lensHub.getFollowNFT(profileID));
        uint256 totalSupply = followNFT.totalSupply();
        address[] memory follower = new address[](totalSupply);
        for (uint256 i = 0; i < totalSupply; i++) {
            follower[i] = followNFT.ownerOf(i + 1);
        }
        return follower;
    }

    function getUniqueFollower(uint256 profileID) public view returns (address[] memory follower){
        IERC721Enumerable followNFT = IERC721Enumerable(_lensHub.getFollowNFT(profileID));
        uint256 totalSupply = followNFT.totalSupply();
        address[] memory follower = new address[](totalSupply);
        uint256 duplicateCounter = 0;
        for (uint256 i = 0; i < totalSupply; i++) {
            bool isDuplicate = false;
            address followerAddress = followNFT.ownerOf(i + 1);
            for (uint256 j = 0; j < i; i++) {
                if (follower[j] == followerAddress) {
                    isDuplicate = true;
                    duplicateCounter++;
                    break;
                }
            }
            if (!isDuplicate) {
                follower[i - duplicateCounter] = followerAddress;
            }
        }
        uint256 nUniqueFollower = totalSupply - duplicateCounter;
        address[] memory uniqueFollower = new address[](nUniqueFollower);
        for (uint256 i = 0; i < nUniqueFollower; i++) {
            uniqueFollower[i] = follower[i];
        }
        return uniqueFollower;
    }

    function createGiveaway(uint256 profileID) public payable returns (Giveaway memory) {
        address winner = _getRandomFollowerAddress(profileID);
        address donor = msg.sender;
        uint256 prize = msg.value;
        Giveaway memory giveaway = Giveaway(donor, profileID, prize, winner);
        // transfer amount to winner
        console.log('balance');
        console.log(address(winner).balance);
        payable(address(winner)).transfer(prize);
        emit SendPrize(donor, winner, prize);
        console.log(address(winner).balance);
        _giveaways[profileID].push(giveaway);
        return giveaway;
    }

    function getProfileIdByHandle(string calldata handle) public view returns (uint256){
        return _lensHub.getProfileIdByHandle(handle);
    }

    function getGiveaways(uint256 profileID) public returns (Giveaway[] memory) {
        return _giveaways[profileID];
    }

    function _getRandomFollowerAddress(uint256 profileID) private returns (address) {
        address watch_addr = 0x038B86d9d8FAFdd0a02ebd1A476432877b0107C8;
        _lensHub = LensHub(watch_addr);
        IERC721Enumerable followNFT = IERC721Enumerable(_lensHub.getFollowNFT(profileID));
        uint256 totalSupply = followNFT.totalSupply();
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
        uint256 winnerIndex = 1 + randomNumber % totalSupply;
        console.log(winnerIndex);
        return followNFT.ownerOf(winnerIndex);
    }

}
