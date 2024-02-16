const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');
const checkDeleteToken = require('./check_delete_token');
const insertReceipt = require('../../MongoDB/controllers/insertReceipt.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const exchangeTokens = async(req, res, next) => {

    let product_id1 = req.body.product_id1;
    let user_id1 = req.body.user_id1;
		let product_id2 = req.body.product_id2;
    let user_id2 = req.body.user_id2;



    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(user_id1);


        const gateway = new Gateway();

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: user_id1, // cause user1 accepts the proposed exchange by user1
            // identity: creator_id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName, "Marketplace");
        console.log (user_id1)


        console.log('\n--> Submit Transaction: ExchangeTokens, allows user1 to confirm and implement a token exchange');
        // let result = await contract.submitTransaction('BuyProduct', product_id, seller, buyer, access_times, access_period);
        let result = await contract.submitTransaction('ExchangeTokens', user_id1, user_id2, product_id1, product_id2);
				console.log('*** Result: committed', result, '***');

        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);





        res.status(200).send({message: "OK!"});

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

			console.log('Exchanging tokens failed with error: '+error);

			res.status(403).send('Exchanging tokens failed with error: '+error)

    }

}
module.exports = exchangeTokens;
