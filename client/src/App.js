import './App.css';
import React, {useEffect, useState} from 'react';
import getWeb3 from "./getWeb3";
import GiveawayModule from "./contracts/GiveawayModule.json";
import {BallTriangle} from "react-loader-spinner";

function App() {
    const [profileID, setProfileID] = useState(1);
    const [follower, setFollower] = useState([]);
    const [giveawayResult, setGiveawayResult] = useState(null);
    const [hasRequestedResults, setHasRequestedResults] = useState(false);
    const [loadingState, setLoadingState] = useState('');
    const [web3state, setWeb3state] = useState({web3: null, accounts: null, contract: null});

    useEffect(async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = GiveawayModule.networks[networkId];
            console.log("deployedNetwork" + JSON.stringify(deployedNetwork));
            const instance = new web3.eth.Contract(
                GiveawayModule.abi,
                deployedNetwork && deployedNetwork.address,
            );

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            setWeb3state({web3, accounts, contract: instance});
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    })

    return (
        <div className="App">
            <header className="App-header">
                <h3>
                    Giveaway
                </h3>
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        const {web3, accounts, contract} = web3state;
                        //setLoadingState('');
                        const _handle = event.target.handle.value;
                        const _profileID = await contract.methods.getProfileIdByHandle(_handle).call();
                        setProfileID(_profileID);
                        console.log('profileID: ' + _profileID);
                        const followerResult = await contract.methods.getFollower(_profileID).call();
                        console.log('followerResult: ' + followerResult);
                        setFollower([...new Set(Object.values(followerResult))]);
                        setHasRequestedResults(true);
                    }}
                >
                    <input name="handle" type="text" defaultValue="lens"/>
                    <button type="submit" className="cta-button submit-gif-button">
                        Show followers
                    </button>
                </form>

                <div style={{}}>
                    {hasRequestedResults ? (Object.values(follower).length + ' followers:') : ''}
                </div>
                {follower.map((val) => <div style={{fontSize: 26}} key={val}>{val}<br/>
                </div>)}
                <br/>
                <br/>
                <br/>
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        const {web3, accounts, contract} = web3state;
                        setLoadingState('Creating giveaway');
                        console.log('accounts: ' + accounts);
                        console.log('profileID: ' + profileID);
                        //console.log('handle: ' + (await contract.methods.getHandle(profileID).call()));
                        const giveaway = await contract.methods.createGiveaway(profileID).send({
                            from: accounts[0],
                            value: web3.utils.toWei(event.target.amount.value.toString(), "ether")
                        });
                        console.log('giveaway: ' + JSON.stringify(giveaway));
                        console.log(giveaway.events.SendPrize.returnValues._value + ' were sent to ' + giveaway.events.SendPrize.returnValues._to);
                        setGiveawayResult({
                            winner: giveaway.events.SendPrize.returnValues._to,
                            eth: web3.utils.fromWei(giveaway.events.SendPrize.returnValues._value)
                        })
                        const giveaways = await contract.methods.getGiveaways(profileID).call();
                        console.log('giveaways: ');
                        console.log(giveaways);
                        setLoadingState('');
                    }}
                >
                    MATIC: <input name="amount" type="number" step="0.0001" defaultValue="0.0001"/>
                    <button type="submit" className="cta-button submit-gif-button">
                        Giveaway!
                    </button>
                </form>
                {giveawayResult ? '' + giveawayResult.winner + ' won ' + giveawayResult.eth + ' MATIC' : ''}
                <div style={{
                    visibility: loadingState === '' ? 'hidden' : 'visible',
                    display: 'flex',
                    fontSize: 15
                }}>
                    <BallTriangle
                        height="40"
                        width="40"
                        color="grey"
                        ariaLabel="loading-indicator"
                    />
                </div>
                <div style={{fontSize: 16}}>{loadingState}</div>

            </header>
        </div>
    );
}

export default App;
