const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


// const checkDeleteToken = async(user_id, product_id) => {
async function checkDeleteToken(user_id, product_id) {

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(user_id);


        const gateway = new Gateway();

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: user_id, // not sure about this one
            // identity: creator_id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName,);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName, "Marketplace");


        console.log('\n--> Submit Transaction: DeleteToken, checks if token has to be deleted and deletes it');
        // let result = await contract.submitTransaction('BuyProduct', product_id, seller, buyer, access_times, access_period);
        await contract.submitTransaction('DeleteToken', product_id, user_id);
        console.log('*** DeleteToken successfully run');

        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        // res.status(200).send(JSON.parse(result));

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log(`delete token for ${product_id} failed with error: `+error);


    }

}
module.exports = checkDeleteToken;
