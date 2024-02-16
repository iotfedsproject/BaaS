const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
var schedule = require('node-schedule');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');
const checkDeleteToken = require('./check_delete_token');
const insertReceipt = require('../../MongoDB/controllers/insertReceipt.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const chaincodeName2 = 'token_erc20';
const chaincodeName3 = 'basic';
const chaincodeName4 = 'federationsmanage';
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

const buyProduct = async(req, res, next) => {

    const {product_id, buyer, seller, marketplace, streaming, access, price, lp, hp, fp }= req.body;

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(buyer);


        const gateway = new Gateway();

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: buyer, // not sure about this one
            // identity: creator_id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract3 = network.getContract(chaincodeName3);
        let buyerProfile = await contract3.evaluateTransaction('ReadUser', buyer);
        buyerProfile=JSON.parse(buyerProfile);
        if (buyerProfile.Balance < price){
            return res.status(400).send(`You can't buy product ${product_id} because your balance is not enough!`);
        }

        const contract = network.getContract(chaincodeName, "Marketplace");
        console.log (buyer)
        const contract4 = network.getContract(chaincodeName);
        console.log('\n--> Evaluate Transaction: GetProduct, get product with ID, price, resource ids and product details');
        let result3= await contract4.evaluateTransaction('GetProduct', product_id);
        console.log('*** Result: committed', JSON.parse(result3), '***');

        let resources = JSON.parse(result3);

        //check if product is on global marketplace
        if (marketplace=='global' && resources.GlobalMarketplace_id==false){
            return res.status(400).send({message:`Product ${product_id} does not exist in the Global Marketplace!`})
        }else{
            resources=Object.keys(resources.Resource_ids)

            let minFr=[];
            let maxLr=[];
            let minHr=[];
            for (var i=0;i<resources.length;i++){
                console.log('\n--> Evaluate Transaction: GetResource, get resource info');
                resources[i] = await contract4.evaluateTransaction('GetResource', resources[i]);
                //console.log('*** Result: committed', JSON.parse(resources[i]), '***');
                resources[i]=JSON.parse(resources[i]);
                if (resources[i].fed_id.length<1){
                    return res.status(400).send(`You can't buy product ${product_id} because product's resource ${resources[i].Resource_id} is inactive!`);
                }
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
            let arrayOfOwners=[];
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
                if (byParam[i][0].owner != buyer){
                    arrayOfOwners.push({"owner":byParam[i][0].owner,"payment":payment}) 
                }else{
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
            const contract5 = network.getContract(chaincodeName4);
            console.log('\n--> Evaluate Transaction: ReadAsset, function returns federation attributes');
            let resultFED = await contract5.evaluateTransaction('ReadAsset', federation.FedMarketplace_id);
            resultFED=JSON.parse(resultFED);
            let fedCharge=resultFED.rules.IoTFedsRules.FedMarketplace.FedMarketCharge;
            let fedPayment=0;
            if (marketplace=='global'){
                let globalCharge=resultFED.rules.IoTFedsRules.FedMarketplace.GlobalMarketCharge;
                if (buyerPayment>0){
                    let totalPaymentTemp=totalPayment*fedCharge*globalCharge;
                    fedPayment=totalPaymentTemp*(1-(1/globalCharge));
                    totalPayment=totalPayment-buyerPayment;
                    totalPayment=totalPayment*fedCharge*globalCharge;
                }else{
                    totalPayment=totalPayment*fedCharge*globalCharge;
                    fedPayment=totalPayment*(1-(1/globalCharge));
                }
            }else {
                if (buyerPayment>0){
                    let totalPaymentTemp=totalPayment*fedCharge;
                    fedPayment=totalPaymentTemp*(1-(1/fedCharge));
                    totalPayment=totalPayment-buyerPayment;
                    totalPayment=totalPayment*fedCharge;
                }else{
                    totalPayment=totalPayment*fedCharge;
                    fedPayment=totalPayment*(1-(1/fedCharge));
                }
            }    
            console.log("TOTAL_PAYMENT: ",totalPayment)
    
            console.log("RESOURCE OWNERS AND THEIR PAYMENTS: ",arrayOfOwners)
            totalPayment=totalPayment.toFixed(2);
            if (price!=totalPayment){
                return res.status(400).send(`Product price changed! New price is ${totalPayment} FedCoins. Please repeat the procedure again if you want to buy this product.`)
            }
    
            console.log('\n--> Submit Transaction: BuyProduct, lets user buy a specifc product, if the right conditions are met');
            let result = await contract.submitTransaction('BuyProduct', product_id, buyer, seller, access, streaming, marketplace, lp, hp, fp);
            console.log(JSON.parse(result));
            result = JSON.parse(result);
            console.log('*** Result: committed', result[0], '***');
    
            console.log(`*** Result: ${prettyJSONString(result[0].toString())}`);
    
            let token = JSON.parse(result[1])
            console.log("Token is  ",token[product_id])
            console.log(token[product_id].ValidUntil)
            console.log("DATE Token is valid until ",new Date(token[product_id].ValidUntil))
    
            let receipt = JSON.parse(result[0]);  
    
            // save receipt on MongoDB
            await insertReceipt(receipt);
    
            let dateToDelete = new Date(token[product_id].ValidUntil);
    
    
            // Set token deltion time and process: delete token when the expiration date comes
            if (dateToDelete.getHours()>12){ dateToDelete.setHours(dateToDelete.getHours()-12)};
    
            const tokenDeletion = schedule.scheduleJob(dateToDelete, async function() {
                console.log(`Deleting invalid token for product ${product_id} of user ${buyer}...`);
                
                try {
                    await contract.submitTransaction('DeleteToken', product_id, buyer);
                    console.log('*** DeleteToken successfully run');
                } catch (error) {
                    console.error('Error running DeleteToken:', error);
                }
            
                // Cancel the schedule after the function is executed
                tokenDeletion.cancel();
            });
    
            const contract2 = network.getContract(chaincodeName2);
            
            for (var i=0;i<arrayOfOwners.length;i++){
                let clientID= await getRecipientID(arrayOfOwners[i].owner);
                console.log('\n--> Submit Transaction: Transfer, Transfer tokens to resource owner');
                let result2 = await contract2.submitTransaction('Transfer', clientID, arrayOfOwners[i].payment);
                console.log('*** Result: committed', result2, '***');
                console.log('\n--> Submit Transaction: UpdateUserBalance updates the balance of the resource owner by the input payment');
                await contract3.submitTransaction('UpdateUserBalance', arrayOfOwners[i].owner, arrayOfOwners[i].payment);
            } 
    
            //let fees=Math.trunc(price*0.02);
            let clientID2= await getRecipientID(federation.FedMarketplace_id);
            console.log('\n--> Submit Transaction: Transfer, Transfer fees to Federation');
            let result5 = await contract2.submitTransaction('Transfer', clientID2, fedPayment);
            console.log('*** Result: committed', result5, '***');
    
            let result4=-Number(price);
            console.log('\n--> Submit Transaction: UpdateUserBalance updates the balance of the buyer by the TOTAL_PAYMENT');
            await contract3.submitTransaction('UpdateUserBalance', buyer, result4);
    
            await contract5.submitTransaction('UpdateFedBalance', federation.FedMarketplace_id, fedPayment);
    
            gateway.disconnect();
    
            res.status(200).send({"Receipt":receipt, "AccessToken": token[product_id]});
        }

    }

    catch(error) {

        console.log(`buy product ${product_id} failed with error: `+error);

        res.status(400).send({error: 'Buying product failed ...'+error})

    }

}

async function getRecipientID(seller){
    const ccp = buildCCPOrg1();

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    await wallet.get(seller);

    const gateway = new Gateway();

    console.log("Trying to connect to gateway...")
    await gateway.connect(ccp, {
        wallet,
         identity: seller,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    console.log("Connected!!!")

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName2);
        
    console.log('\n--> Submit Transaction: ClientAccountID');
    let clientID = await contract.evaluateTransaction('ClientAccountID');
    console.log('*** Result: committed', clientID, '***');

    gateway.disconnect();
    return clientID;
};

module.exports = buyProduct;

