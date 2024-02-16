const mongoose = require('mongoose');
const db = mongoose.connection;

const retrieveAccessLogs = async (user_id, fromDate, toDate, product_id)  => {


    let query = {};

    if (user_id){

        query.User = user_id;
    }

    if (fromDate || toDate) {
        query.DateAccessed = {};
    
        if (fromDate) {
            fromDate = new Date(fromDate);
            query.DateAccessed.$gte = fromDate;
        }
    
        if (toDate) {
            toDate = new Date(toDate);
            toDate.setUTCHours(23, 59, 59, 999);
            query.DateAccessed.$lt = toDate;
        }
    }
    if (product_id){

        query.ProductID = product_id;
    }
    query.DateAccessed.$exists = true

    let accessLogs = await db.collection("logs").find(query).project({_id:0, __v:0}).toArray();

        

    return accessLogs;
}

module.exports = retrieveAccessLogs;