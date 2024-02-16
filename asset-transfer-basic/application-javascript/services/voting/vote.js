const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// var axios = require('axios');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');
const { userInfo } = require('os');

const channelName = 'mychannel';
const chaincodeName = 'federationsmanage';
const mspOrg1 = 'iotfedsMSP';


const walletPath = path.join(__dirname,'../..','wallet');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// access config var
process.env.TOKEN_SECRET;

// const {ccps, msps, caClients, cas} = require('../../helpers/initalization');
function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


// TODO: check if member to add exists

const registerVote = async(req, res, next) => {

    //should be given by request or taken from a token (e.g. jwt)
    let voting_id;
    let user_id;

		const token = req.body.token;
		if (token == null) {
	    return res.sendStatus(401);
	  }

    const vote = req.body.vote;

    try {
      let decoded=jwt.verify(token, process.env.TOKEN_SECRET.toString())
      voting_id = decoded.IDvoting;
      user_id = decoded.IDvoter;

			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

			// setup the wallet to hold the credentials of the application user
			// const wallet = await buildWallet(Wallets, walletPath);
			// const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
			const wallet = await Wallets.newFileSystemWallet(walletPath);

            // TODO: get identity from wallet
            // let user = wallet.get(user_id);


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
            identity: user_id,
            // identity: user
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName, "Voting");



        console.log('\n--> Submit Transaction: Vote, registers the vote of a user');
        result = await contract.submitTransaction('Vote', voting_id, user_id, vote);

        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }
				if (!result.status) {

					let IDvoting = result.ID;
					let votingResult = await contract.submitTransaction('GetVotingResult', result);
					let url = `https://symbiote-core.iotfeds.intracom-telecom.com/administration/generic/result?votingId=${voting_id}&status=${votingResult.toString('utf-8')}`;

					var myHeaders = new Headers();
					myHeaders.append("Content-Type", "application/json");

					var raw = "";

					var requestOptions = {
						method: 'POST',
						headers: myHeaders,
						body: raw,
						redirect: 'follow'
					};

					fetch(url, requestOptions)
						.then(response => response.text())
						.then(result => console.log(result))
						.catch(error => console.log('error', error));

				}


        res.status(200).send(result);
				// res.status(200).send(result);

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('Register vote of user  failed with error: '+error);

        res.status(400).send('Register vote of user  failed: '+error)


    }

}
module.exports = registerVote;
