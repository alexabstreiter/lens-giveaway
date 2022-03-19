# DecentralizedWebArchive
A decentralized version of web archive

## Description
Users can paste URLs of Websites or API Calls in Decentralized WebArchive to automatically upload a snapshot of the response to Filecoin. Similarly, all stored snapshots of a given URL can be listed and downloaded on demand.

## Technologies used
We used Truffle for the development of the smart contracts handling the metadata of snapshots, and Filecoin to upload snapshots. Specifically, we used the textile-js wrapper to interact with Filecoin through our client. The web app was built using react.

## Inspiration
WebArchive is a great tool to conserve versions of websites at certain points in time. However, since it is centralized, it does not provide proof that the version is indeed the original one and has not been manipulated. Decentralized WebArchive solves this problem by providing verifiability through storing the snapshots on Filecoin and storing metadata of snapshots on-chain.

## Testing guide
`truffle deploy`
`cd client`
`npm start`
Don't forget to connect metamask to your local testnet!
