const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
var crypto = require('crypto');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const verifyReceipt = async(req, res, next) => {

    let receipt = req.body.receipt;
    let user = req.body.user_id;


    try {

        if (!receipt.hasOwnProperty('TransactionID') || !receipt.hasOwnProperty('ProductID') || !receipt.hasOwnProperty('DateBought') 
        || !receipt.hasOwnProperty('Buyer') || !receipt.hasOwnProperty('Seller')) {

            throw new Error ("Malformed receipt...")
           
        }

        let tx_id = receipt.TransactionID;
        console.log ("tx_is id ", tx_id)
        receipt.DateBought = new Date(receipt.DateBought).toUTCString();
        console.log("Date is ", receipt.DateBought)
        receipt = JSON.stringify(receipt);

        let hash = crypto.createHash('sha512');
        let data_hash = hash.update(receipt, 'utf-8');
        let tx_hash= data_hash.digest('hex');
        console.log ("HASH IS ", tx_hash)

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(user);


        const gateway = new Gateway();

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: user, // not sure about this one
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName, "Marketplace");

        console.log('\n--> Submit Transaction:VerifyReceipt is called to verify the integrity of a receipt/log');
        let result = await contract.submitTransaction('VerifyReceipt', receipt, tx_id, tx_hash);
        console.log(result)
        result = JSON.parse(result);
        console.log('*** Result: committed', result,'***');

        gateway.disconnect();

        res.status(200).send({"Verified":result});


    }

    catch(error) {

        console.log(`Verify receipt failed with error: `+error);

        if (error.toString().includes('Malformed receipt')){

            res.status(400).send({error: 'Verify receipt operation failed ...'+error})
        }
        else{

            res.status(500).send({error: 'Verify receipt operation failed ...'+error})
        }


    }

}
module.exports = verifyReceipt;
