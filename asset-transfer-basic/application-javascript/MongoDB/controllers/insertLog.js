const mongoose = require('mongoose');
const logModel = require('../../MongoDB/models/log.model');

const insertLog = async (log) => {

    let newLog;

    try{    
        
        
        newLog = new logModel ({

        _id: new mongoose.Types.ObjectId(),
        TransactionID: log.TransactionID,
        User: log.User,
        ProductID: log.ProductID,
        DateAccessed: log.DateAccessed

        
        });

        await newLog.save();
    }


    catch(err){

        console.log(err);

        return err;
    }

        


    return newLog;

}

module.exports = insertLog;