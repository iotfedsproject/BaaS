const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const chaincodeName2 = 'products';
const mspOrg1 = 'iotfedsMSP';


const secret = process.env.HASH_SECRET;
console.log(secret)
console.log(typeof secret);


const walletPath = path.join(__dirname,'../..','wallet');


// const {ccps, msps, caClients, cas} = require('../../helpers/initalization');
function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const registerDevice = async(req, res, next) => {

    //should be given by request or taken from a token (e.g. jwt)
    const idPlatform = req.body.platform_id;
		const idDevice = req.body.device_id;
        const user=req.body.user;

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
            identity: 'iotFedsAdmin',
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
				const contract2 = network.getContract(chaincodeName2);


				console.log("\n--> Submit Transaction: registers Device to a user's platform");
				await contract.submitTransaction('RegisterDevice', idDevice, idPlatform,user);
				console.log('*** Result: committed');

				console.log('\n--> Submit Transaction: CreateResource, creates new resource with device ID in the product ledger');
        let result = await contract2.submitTransaction('CreateResource', idDevice, idPlatform, user);
        console.log('*** Result: committed', result, '***');

        res.status(200).send({message: "OK!"});

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('Device registration failed with error: '+error);

        res.status(400).send({error: 'Registration failed: '+error})


    }

}
module.exports = registerDevice;
