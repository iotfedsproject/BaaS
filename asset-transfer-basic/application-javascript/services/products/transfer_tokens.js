const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'token_erc20';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const transferTokens = async(req, res, next) => {

    let amount = req.body.amount;
    let sender=req.body.sender;
    let recipient=req.body.recipient;

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        // setup the wallet to hold the credentials of the application user
        // const wallet = await buildWallet(Wallets, walletPath);
        // const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(sender);


        // Create a new gateway instance for interacting with the fabric network.
        // In a real application this would be done as the backend server session is setup for
        // a user that has been verified.
        const gateway = new Gateway();

        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            //identity: 'iotFedsAdmin', // not sure about this one
             identity: sender,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        let clientID= await getRecipientID(recipient);
        console.log('\n--> Submit Transaction: Transfer, Transfer tokens');
        let result = await contract.submitTransaction('Transfer', clientID, amount);
        console.log('*** Result: committed', result, '***');
    
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        res.status(200).send({message: "OK!"});

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('Transfer tokens failed with error: '+error);

        res.status(403).send('Transfer tokens failed: '+error)


    }

}

async function getRecipientID(recipient){
    const ccp = buildCCPOrg1();

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    await wallet.get(recipient);

    const gateway = new Gateway();

    console.log("Trying to connect to gateway...")
    await gateway.connect(ccp, {
        wallet,
         identity: recipient,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    console.log("Connected!!!")

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);
        
    console.log('\n--> Submit Transaction: ClientAccountID');
    let clientID = await contract.evaluateTransaction('ClientAccountID');
    console.log('*** Result: committed', clientID, '***');

    gateway.disconnect();
    return clientID;
};

module.exports = transferTokens;
