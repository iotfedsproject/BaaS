const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const {sendmail} = require('../../nodemailer/node_modules/nodemailer/sendmail');

const channelName = 'mychannel';
const chaincodeName = 'federationsmanage';
const chaincodeNameUser = 'basic';
const mspOrg1 = 'iotfedsMSP';


const walletPath = path.join(__dirname,'../..','wallet');

var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// access config var
process.env.TOKEN_SECRET;

function generateAccessToken(IDvoting, IDvoter) {
  return jwt.sign({IDvoting: IDvoting, IDvoter: IDvoter}, process.env.TOKEN_SECRET, { expiresIn: '86400s' });
}


// const {ccps, msps, caClients, cas} = require('../../helpers/initalization');
function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const removeFedMemberRequest = async(req, res, next) => {

    const fed_id = req.body.fed_id;
    const requestor_id = req.body.requestor_id;
    // the user to remove
    const user_id = req.body.user_id;

    try {

			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

			// setup the wallet to hold the credentials of the application user
			// const wallet = await buildWallet(Wallets, walletPath);
			// const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
			const wallet = await Wallets.newFileSystemWallet(walletPath);


            // TODO: get identity from wallet
            // let requestor = wallet.get(requestor_id);

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
            // identity: requestor
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);


        console.log('\n--> Submit Transaction: RemoveFedMemberRequest, requests to remove a member of a federation');
        result = await contract.submitTransaction('RemoveFedMemberRequest', requestor_id, user_id, fed_id);
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }

        result = JSON.parse(result);
        console.log(result['votes'])

				let voting_id = result['ID'];
        let votes = JSON.stringify(result['votes']);

        let usernames = [];
        let tokens = [];

        for (var v in result['votes']){

            if (result['votes'].hasOwnProperty(v)){

                usernames.push(v);
                // tokens.push(voting_id.concat("/",v))
								tokens.push(generateAccessToken(voting_id, v));
            }
        }

        // Get the contract from the network.
        const contractUser = network.getContract(chaincodeNameUser);

        console.log('\n--> Evaluate Transaction: GetMails, get the mail of the voters');
        let votersMail = await contractUser.evaluateTransaction('GetMails',votes);

        let votersMailArray = JSON.parse(votersMail);
				console.log(votersMailArray);

				function sleep(ms) {
    			return new Promise(resolve => setTimeout(resolve, ms));
				}

        for (let i=0; i<votersMailArray.length; i++){

            console.log(votersMailArray[i]+" "+tokens[i])

            sendmail(votersMailArray[i], tokens[i]);
						await sleep(1000);
        }


        res.status(200).send(result);

        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('Request to remove a member from federation failed with error: '+error);

        res.status(400).send('Request to remove a member from federation failed ...')


    }

}
module.exports = removeFedMemberRequest;
