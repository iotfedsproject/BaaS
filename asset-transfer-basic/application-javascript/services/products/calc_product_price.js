const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const chaincodeName2 = 'federationsmanage';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

function groupBy(array, f) {
    let groups = {};
    array.forEach(function (o) {
      var group = JSON.stringify(f(o));
      groups[group] = groups[group] || [];
      groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
      return groups[group];
    })
}

const calcProductPrice = async(req, res, next) => {

    const {product_id, user_id, marketplace, streaming, access, lp, hp, fp }= req.body;

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

        const contract = network.getContract(chaincodeName);
        console.log('\n--> Evaluate Transaction: GetProduct, get product with ID, price, resource ids and product details');
        let result3= await contract.evaluateTransaction('GetProduct', product_id);
        console.log('*** Result: committed', JSON.parse(result3), '***');

        let resources = JSON.parse(result3);

        //check if product is on global marketplace
        if (marketplace=='global' && resources.GlobalMarketplace_id==false){
            return res.status(400).send({message:`Product ${product_id} does not exist in the Global Marketplace!`})
        }

        resources=Object.keys(resources.Resource_ids)
        let minFr=[];
        let maxLr=[];
        let minHr=[];
        for (var i=0;i<resources.length;i++){
            console.log('\n--> Evaluate Transaction: GetResource, get resource info');
            resources[i] = await contract.evaluateTransaction('GetResource', resources[i]);
            //console.log('*** Result: committed', JSON.parse(resources[i]), '***');
            resources[i]=JSON.parse(resources[i]);
            minFr.push(resources[i].Fr);
            maxLr.push(resources[i].Lr);
            minHr.push(resources[i].Hr);
            console.log("Lr date: ",i, new Date(resources[i].Lr).toISOString())
            console.log("Hr date: ",i, new Date(resources[i].Hr).toISOString())
        }
        if (streaming==true && fp>Math.min(...minFr)){
            return res.status(400).send(`Not acceptable fp value--> fp: ${fp} > min(Fr): ${Math.min(...minFr)}`);
        }
        let lp_epoch= new Date(lp).getTime();
        if (streaming==false && lp_epoch<Math.max(...maxLr)){
            return res.status(400).send(`Not acceptable lp value--> lp: ${lp} < max(Lr): ${new Date(Math.max(...maxLr)).toISOString()}`);
        }
        let hp_epoch= new Date(hp).getTime();
        if (hp_epoch>Math.min(...minHr)){
            return res.status(400).send(`Not acceptable hp value--> hp: ${hp} > min(Hr): ${new Date(Math.min(...minHr)).toISOString()}`);
        }

        if (streaming==false && lp_epoch>hp_epoch){
            return res.status(400).send(`Not acceptable lp value--> lp: ${lp} > hp: ${hp}`);
        }

        let byParam = groupBy(resources, function (item) {
            return [item.owner];
        });
        let payment=0;
        let totalPayment=0;
        let buyerPayment=0;
        let tbp= Date.now();
        tbp=((tbp/1000)/60)/60
        hp_epoch=((hp_epoch/1000)/60)/60;
        lp_epoch=((lp_epoch/1000)/60)/60;

        let tep=Math.max(tbp,hp_epoch) + 2160;

        let Wmin=tbp - lp_epoch;
        let Wmax=tep - lp_epoch;
        console.log("tbp: ",tbp)
        console.log("tep: ",tep)
        for (var i=0;i<byParam.length;i++){
            if (streaming){
                byParam[i].forEach((item,index)=>{
                    let Ds=Math.max(fp-item.fr,0)
                    let frDs=(2-item.Brr) + ((2*(item.Brr-1))/(1+Math.pow(Math.E,-item.arf*Ds)))
                    console.log("fr(Ds): ",frDs, item.Resource_id, tep-tbp)
                    payment+=(item.Price/item.arr)*(fp*(tep-tbp))*frDs;
                })
            }else{
                byParam[i].forEach((item,index)=>{
                    let Dw=(Math.max(Wmin-(item.Wr),0)+Math.max(Wmax-(item.Wr),0))/2
                    let frDw=(2-item.Brd) + ((2*(item.Brd-1))/(1+Math.pow(Math.E,-item.ard*Dw)))
                    payment+=item.Price*Math.pow(access, 1/item.aro)*frDw;
                    console.log("fr(Dw): ",frDw, Dw, item.Wr, Wmin, Wmax)
                })
            }
            if (byParam[i][0].owner == user_id){
                buyerPayment+=payment;
            }
            totalPayment+=payment
            console.log("telos", i, payment, totalPayment)

            payment=0;
        }
        if (totalPayment==buyerPayment){
            return res.status(400).send(`You can't buy product ${product_id} because all product's resources belongs to you!`);
        }
        let federation=JSON.parse(result3);
        const contract2 = network.getContract(chaincodeName2);
        console.log('\n--> Evaluate Transaction: ReadAsset, function returns federation attributes');
        let resultFED = await contract2.evaluateTransaction('ReadAsset', federation.FedMarketplace_id);
        resultFED=JSON.parse(resultFED);
        let fedCharge=resultFED.rules.IoTFedsRules.FedMarketplace.FedMarketCharge;
        console.log("TOTAL_PAYMENT: ",totalPayment)
        if (buyerPayment>0){
            totalPayment=totalPayment-buyerPayment;
        }
        console.log("TOTAL_PAYMENT2: ",totalPayment)
        if (marketplace=='global'){
            let globalCharge=resultFED.rules.IoTFedsRules.FedMarketplace.GlobalMarketCharge;
            totalPayment=totalPayment*fedCharge*globalCharge;
        }else {
            totalPayment=totalPayment*fedCharge;
        }
        let finalJson={};
        if (marketplace=='global' && resultFED.members_ids.includes(user_id)){
            finalJson={
                price:totalPayment.toFixed(2),
                message: `You are member of federation ${resultFED.ID}. It is recommended to buy from the corresponding market of the federation for a cheaper product price`
            }
        }else {
            finalJson={
                price:totalPayment.toFixed(2)
            }
        }

        res.status(200).send(finalJson);
        //res.status(200).send(`Final product price: ${totalPayment.toFixed(2)} FedCoins`);

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(err) {

        console.log(`Get federated resources failed with error: `+err);

        res.status(403).send({error: 'Get federated resources failed ...'+err})
        // .responses[0].response.message
    }

}
module.exports = calcProductPrice;

