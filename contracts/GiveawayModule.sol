// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

//import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract LensHub {
    function getFollowNFT(uint256 profileId) external view returns (address) {return 0x0000000000000000000000000000000000000000;}

    function defaultProfile(address wallet) external view returns (uint256) {return 0;}

    function getProfileIdByHandle(string calldata handle) external view returns (uint256) {return 0;}

    function getHandle(uint256 profileId) external view returns (string memory) {return "";}
}

contract GiveawayModule is VRFConsumerBase {
    event SendPrize(address indexed _from, address indexed _to, uint256 _value);
    event TestDone(bytes32 requestId, uint256 randomness);

    LensHub _lensHub;
    mapping(uint256 => Giveaway[]) _giveaways;

    bytes32 internal keyHash;
    uint256 internal fee;
    
    uint256 public randomResult;

    struct Giveaway {
        address donor;
        uint256 profileID; // this can be removed since it is the key of the mapping
        uint256 amount;
        address winner;
    }

    constructor() VRFConsumerBase(
            0x8C7382F9D8f56b33781fE506E897a4F1e2d17255, // VRF Coordinator
            0x326C977E6efc84E512bB9C30f76E30c160eD06FB  // LINK Token
        ) {
        address watch_addr = 0xd7B3481De00995046C7850bCe9a5196B7605c367; // lens hub proxy on mumbai testnet
        _lensHub = LensHub(watch_addr);
        keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4;
        fee = 0.0001 * 10 ** 18; // 0.0001 LINK
    }

    /** 
     * Requests randomness 
     */
    function getRandomNumber() public returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) > fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness;
        emit TestDone(requestId, randomness);
    }

    function getFollower(uint256 profileID) public view returns (address[] memory follower){
        address followNFTAddress = _lensHub.getFollowNFT(profileID);
        // if a lens profile has no followers, the followNFT address is 0x0 
        if (followNFTAddress == address(0)) {
            return new address[](0);
        }
        IERC721Enumerable followNFT = IERC721Enumerable(followNFTAddress);
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
        (bool sent, bytes memory data) = payable(address(winner)).call{value : prize}("");
        emit SendPrize(donor, winner, prize);
        _giveaways[profileID].push(giveaway);
        return giveaway;
    }

    function getProfileIdByHandle(string calldata handle) public view returns (uint256){
        return _lensHub.getProfileIdByHandle(handle);
    }

    function getGiveaways(uint256 profileID) public view returns (Giveaway[] memory) {
        return _giveaways[profileID];
    }

    function _getRandomFollowerAddress(uint256 profileID) private view returns (address) {
        address followNFTAddress = _lensHub.getFollowNFT(profileID);
        if (followNFTAddress == address(0)) {
            return address(0);
        }
        IERC721Enumerable followNFT = IERC721Enumerable(followNFTAddress);
        uint256 totalSupply = followNFT.totalSupply();
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
        uint256 winnerIndex = 1 + randomNumber % totalSupply;
        return followNFT.ownerOf(winnerIndex);
    }

    function getHandle(uint256 profileID) public view returns (string memory) {
        return _lensHub.getHandle(profileID);
    }

}
