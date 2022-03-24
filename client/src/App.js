import "./App.css";
import React, {useEffect, useState, useCallback} from "react";
import {getWeb3, getWeb3Socket} from "./getWeb3";
import GiveawayModule from "./contracts/GiveawayModule.json";
import {BallTriangle} from "react-loader-spinner";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Web3 from "web3";

function App() {
    const [profileID, setProfileID] = useState(1);
    const [handle, setHandle] = useState("");
    const [follower, setFollower] = useState([]);
    const [pastGiveaways, setPastGiveaways] = useState([]);
    const [giveawayResult, setGiveawayResult] = useState(null);
    const [hasRequestedResults, setHasRequestedResults] = useState(false);
    const [loadingState, setLoadingState] = useState("");
    const [tmpWinner, setTmpWinner] = useState("");
    const [web3state, setWeb3state] = useState({
        web3: null,
        web3Socket: null,
        accounts: null,
        contract: null,
        socketContract: null,
    });

    const initializeEventListener = () => {
        const {contract, accounts, web3, web3Socket, socketContract} = web3state;
        socketContract.events.SendPrize({})
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
                setWeb3state({web3, web3Socket, accounts, contract: instance, socketContract});
            } catch (error) {
                // Catch any errors for any of the above operations.
                alert(
                    `Failed to load web3, accounts, or contract. Check console for details.`
                );
                console.error(error);
            }
        }

        initializeWeb3();
    }, [setWeb3state]);

    const getGiveaways = useCallback(async () => {
        const {contract} = web3state;
        if (contract !== null) {
            const giveaways = await contract.methods.getGiveaways(profileID).call();
            setPastGiveaways(giveaways);
        }
    }, [web3state, profileID]);

    useEffect(() => {
        async function fetchGiveaways() {
            await getGiveaways();
        }

        fetchGiveaways();
    }, [profileID, setPastGiveaways, getGiveaways]);

    let tmpWinnerInterval = 10;
    let breakTmpWinner = false;

    function startTmpWinnerAnimation() {
        breakTmpWinner = false;
        tmpWinnerInterval = 10;
        choseTmpWinner();
    }

    function choseTmpWinner() {
        if (breakTmpWinner) {
            setTmpWinner("");
            return;
        }
        setTmpWinner(follower[Math.floor(Math.random() * follower.length)]);
        //tmpWinnerInterval *= 1.01;
        window.setTimeout(choseTmpWinner, tmpWinnerInterval);
    }


    useEffect(() => {
        const {contract} = web3state;
        if (contract !== null) {
            initializeEventListener();
        }
    }, [web3state])

    return (
        <div className="App">
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
            />
            <header className="App-header">
                <Typography variant="h3">Lens Giveaway</Typography>
                <div>
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setPastGiveaways([]);
                            const {contract} = web3state;
                            const _handle = event.target.handle.value;
                            const _profileID = await contract.methods
                                .getProfileIdByHandle(_handle)
                                .call();
                            setHandle(_handle);
                            setProfileID(_profileID);
                            console.log("profileID: " + _profileID);
                            const followerResult = await contract.methods
                                .getFollower(_profileID)
                                .call();
                            console.log("followerResult: " + followerResult);
                            const uniqueFollower = [
                                ...new Set(Object.values(followerResult)),
                            ];
                            setFollower(uniqueFollower);
                            setHasRequestedResults(true);
                            setGiveawayResult(null);
                            breakTmpWinner = true;
                        }}
                    >
                        <TextField variant="outlined" name="handle" defaultValue="lens"/>
                        <Button
                            variant="contained"
                            type="submit"
                            className="cta-button submit-gif-button"
                        >
                            Show followers
                        </Button>
                    </form>
                </div>
                <div style={{}}>
                    <Typography variant="body1">
                        {hasRequestedResults &&
                        (follower.length === 0
                            ? "This profile does not have any followers. Please select a profile with followers to start a giveaway."
                            : Object.values(follower).length + " followers:")}
                    </Typography>
                </div>

                {follower.map((val) => (
                    <div style={{fontSize: 26}} key={val}>
                        <Typography variant="body1"> {val}</Typography>
                    </div>
                ))}
                {handle !== "" && follower.length > 0 && (
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            const {web3, accounts, contract} = web3state;
                            setLoadingState("Raffle ongoing...");
                            startTmpWinnerAnimation();
                            const giveaway = await contract.methods
                                .createGiveaway(profileID)
                                .send({
                                    from: accounts[0],
                                    value: web3.utils.toWei(
                                        event.target.amount.value.toString(),
                                        "ether"
                                    ),
                                });
                        }}
                    >
                        <Typography variant="body1">
                            {" "}
                            MATIC:{" "}
                            <TextField
                                variant="outlined"
                                name="amount"
                                type="number"
                                step="0.0001"
                                defaultValue="0.0001"
                            />
                        </Typography>
                        <Button
                            variant="contained"
                            type="submit"
                            className="cta-button submit-gif-button"
                        >
                            Giveaway to one lucky winner out of all followers of {handle}!
                        </Button>
                    </form>
                )}
                <Typography variant="body1">
                    {giveawayResult
                        ? "" +
                        giveawayResult.winner +
                        " won " +
                        giveawayResult.eth +
                        " MATIC"
                        : tmpWinner}
                </Typography>
                <br/>
                <div
                    style={{
                        visibility: loadingState === "" ? "hidden" : "visible",
                        display: "flex",
                        fontSize: 15,
                    }}
                >
                    <BallTriangle
                        height="40"
                        width="40"
                        color="grey"
                        ariaLabel="loading-indicator"
                    />
                </div>
                <div style={{fontSize: 16}}>{loadingState}</div>
                <div style={{}}>
                    <Typography variant="body1">
                        {hasRequestedResults &&
                        (pastGiveaways.length === 0
                            ? "No past giveaway for this profile."
                            : pastGiveaways.length + " past giveaways:")}
                    </Typography>
                </div>
                {hasRequestedResults &&
                pastGiveaways.map((giveaway, i) => (
                    <Typography variant="body1" key={i}>
                        {giveaway.winner} won {giveaway.amount / 1000000000000000000}{" "}
                        MATIC
                    </Typography>
                ))}
            </header>
        </div>
    );
}

export default App;
