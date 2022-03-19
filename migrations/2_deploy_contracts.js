//var Giveaway = artifacts.require("./Giveaway.sol");
var MetaSnap = artifacts.require("./MetaSnap.sol");

module.exports = function(deployer) {
  deployer.deploy(MetaSnap);
  //deployer.deploy(Giveaway);
};
