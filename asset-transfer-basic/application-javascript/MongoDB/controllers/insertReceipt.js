const mongoose = require('mongoose');
const logModel = require('../models/log.model');

const insertReceipt = async (log) => {


let newLog;

    try{    
        
        
         newLog = new logModel ({

        _id: new mongoose.Types.ObjectId(),
        TransactionID: log.TransactionID,
        Buyer: log.Buyer,
        Seller: log.Seller,
        ProductID: log.ProductID,
        DateBought: log.DateBought
        
        });

        await newLog.save();
        console.log ("ALL GOOD")

    }


    catch(err){

        console.log(err);
        return err;

    }

    return newLog;

}

module.exports = insertReceipt;