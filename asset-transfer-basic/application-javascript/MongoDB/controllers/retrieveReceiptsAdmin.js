const mongoose = require('mongoose');
const db = mongoose.connection;


const retrieveReceiptAdmin = async (user_id, fromDate, toDate, product_id) => {

    if (user_id){

        let buyerOrSeller = [

            {Buyer : user_id},
            {Seller: user_id}
        ];

        var query = { $or: buyerOrSeller };
    }


    if (fromDate || toDate) {
        query.DateBought = {};
    
        if (fromDate) {
            fromDate = new Date(fromDate);
            query.DateBought.$gte = fromDate;
        }
    
        if (toDate) {
            toDate = new Date(toDate);
            toDate.setUTCHours(23, 59, 59, 999);
            query.DateBought.$lt = toDate;
        }
    }

    if (product_id) {

        query.ProductID = product_id;
    }


    let receipts;

        
    receipts = await db.collection("logs").find(query).project({_id:0, __v:0}).toArray();


    return receipts;

}

module.exports = retrieveReceiptAdmin;