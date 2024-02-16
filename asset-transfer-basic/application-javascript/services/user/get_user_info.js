const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
const url = require('url');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
//const chaincodeName2 = 'token_erc20';
const mspOrg1 = 'iotfedsMSP';


const secret = process.env.HASH_SECRET;
console.log(secret)
console.log(typeof secret);


const walletPath = path.join(__dirname,'../..','wallet');


// const {ccps, msps, caClients, cas} = require('../../helpers/initalization');
function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const getUserInfo = async(req, res, next) => {

    //should be given by request or taken from a token (e.g. jwt)
    // const id = req.body.user_id;
		const queryObject = url.parse(req.url, true).query;
		const id = queryObject.user_id;

    try {

			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

			// setup the wallet to hold the credentials of the application user
			// const wallet = await buildWallet(Wallets, walletPath);
			// const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
			const wallet = await Wallets.newFileSystemWallet(walletPath);


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
            identity: id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // const contract2 = network.getContract(chaincodeName2);
        // let result3 = await contract2.evaluateTransaction('ClientAccountID');

        // console.log('\n--> Submit Transaction: BalanceOf, account balance');
        // let result4 = await contract2.evaluateTransaction('BalanceOf',result3);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        // console.log('\n--> Submit Transaction: UpdateUserBalance updates the balance of the input user by the input fee');
        // await contract.submitTransaction('UpdateUserBalance', id, result4);
        // console.log('*** Result: committed');

				console.log('\n--> Evaluate Transaction: ReadUser, function returns user attributes');
				result = await contract.evaluateTransaction('ReadUser', id);
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);


        res.status(200).send(JSON.parse(result));

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('User info access failed with error: '+error);

        res.status(403).send({error: 'Access failed: '+error})


    }

}
module.exports = getUserInfo;
