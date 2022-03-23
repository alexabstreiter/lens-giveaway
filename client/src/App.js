import './App.css';
import React, {useEffect, useState, useCallback} from 'react';
import {getWeb3, getWeb3Socket} from "./getWeb3";
import GiveawayModule from "./contracts/GiveawayModule.json";
import {BallTriangle} from "react-loader-spinner";
import Web3 from "web3";

function App() {
    const [profileID, setProfileID] = useState(1);
    const [handle, setHandle] = useState('');
    const [follower, setFollower] = useState([]);
    const [pastGiveaways, setPastGiveaways] = useState([]);
    const [giveawayResult, setGiveawayResult] = useState(null);
    const [hasRequestedResults, setHasRequestedResults] = useState(false);
    const [loadingState, setLoadingState] = useState('');
    const [web3state, setWeb3state] = useState({web3: null, accounts: null, contract: null, web3Socket: null, socketContract: null});

    const test = () => {
        console.log('call test');
        const {contract, accounts, web3, web3Socket, socketContract} = web3state;
        socketContract.events.SendPrize({
        })
            .on('data', async function (event) {
                console.log("Event received: " + JSON.stringify(event)); // same results as the optional callback above
                setGiveawayResult({
                    winner: event.returnValues._to,
                    eth: web3.utils.fromWei(event.returnValues._value)
                });
                setLoadingState('');
                setPastGiveaways([]);
                await getGiveaways();
            })
            .on('error', console.error);
    }

    useEffect(() => {
        async function initializeWeb3() {
            try {
                // Get network provider and web3 instance.
                const web3 = await getWeb3();
                const web3Socket = await getWeb3Socket(web3);

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
                const socketContract = new web3Socket.eth.Contract(
                    GiveawayModule.abi,
                    deployedNetwork && deployedNetwork.address,
                );

                const provider = web3Socket.currentProvider
                provider.on('error', e => console.log('WS Error', e));
                provider.on('end', async e => {
                    console.log('WS closed');
                    console.log('Attempting to reconnect...');
                    const web3SocketProvider = new Web3.providers.WebsocketProvider("wss://ws-matic-mumbai.chainstacklabs.com");
                    web3SocketProvider.on('connect', function () {
                        console.log('WSS Reconnected');
                    });
                    web3Socket.setProvider(web3SocketProvider)
                });

                // Set web3, accounts, and contract to the state, and then proceed with an
                // example of interacting with the contract's methods.
                setWeb3state({web3, accounts, contract: instance, web3Socket, socketContract});
            } catch (error) {
                // Catch any errors for any of the above operations.
                alert(
                    `Failed to load web3, accounts, or contract. Check console for details.`,
                );
                console.error(error);
            }
        }

        initializeWeb3();
    }, [setWeb3state])


    const getGiveaways = useCallback(async () => {
        const {contract} = web3state;
        if (contract !== null) {
            const giveaways = await contract.methods.getGiveaways(profileID).call();
            setPastGiveaways(giveaways);
        }
    }, [web3state, profileID])

    useEffect(() => {
        async function fetchGiveaways() {
            await getGiveaways();
        }

        fetchGiveaways();
    }, [profileID, setPastGiveaways, getGiveaways])

    useEffect(() => {
        const {contract} = web3state;
        if (contract !== null) {
            test();
        }
    }, [web3state])


    return (
        <div className="App">
            <header className="App-header">
                <h3>
                    Lens Giveaway
                </h3>
                <div>
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setPastGiveaways([])
                            const {contract, accounts, web3} = web3state;
                            const _handle = event.target.handle.value;
                            const _profileID = await contract.methods.getProfileIdByHandle(_handle).call();
                            setHandle(_handle);
                            setProfileID(_profileID);
                            const followerResult = await contract.methods.getFollower(_profileID).call();
                            setFollower([...new Set(Object.values(followerResult))]);
                            setHasRequestedResults(true);
                            setGiveawayResult(null);
                        }}
                    >
                        <input name="handle" type="text" defaultValue="lens"/>
                        <button type="submit" className="cta-button submit-gif-button">
                            Show followers
                        </button>
                    </form>
                </div>
                <div style={{}}>
                    {hasRequestedResults && (follower.length === 0 ? 'This profile does not have any followers. Please select a profile with followers to start a giveaway.' : Object.values(follower).length + ' followers:')}
                </div>
                {follower.map((val) => <div style={{fontSize: 26}} key={val}>{val}<br/>
                </div>)}
                <br/>
                <br/>
                <br/>
                {handle !== '' && follower.length > 0 && <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        const {web3, accounts, contract} = web3state;
                        setLoadingState('Raffle ongoing...');
                        const giveaway = await contract.methods.createGiveaway(profileID).send({
                            from: accounts[0],
                            value: web3.utils.toWei(event.target.amount.value.toString(), "ether")
                        });
                    }}
                >
                    MATIC: <input name="amount" type="number" step="0.000001" defaultValue="0.000001"/>
                    <button type="submit" className="cta-button submit-gif-button">
                        Giveaway to one lucky winner out of all followers of {handle}!
                    </button>
                </form>}
                {giveawayResult ? '' + giveawayResult.winner + ' just won ' + giveawayResult.eth + ' MATIC' : ''}
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
                <div style={{}}>
                    {hasRequestedResults && (pastGiveaways.length === 0 ? 'No past giveaway for this profile.' : pastGiveaways.length + ' past giveaways:')}
                </div>
                {hasRequestedResults && pastGiveaways.map((giveaway, i) => <div style={{fontSize: 26}}
                                                                                key={i}>{giveaway.winner} won {giveaway.amount / 1000000000000000000} MATIC<br/>
                </div>)}

            </header>
        </div>
    );
}

export default App;
