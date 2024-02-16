const mongoose = require('mongoose');
const db = mongoose.connection;


const retrieveReceiptBuyer = async (buyer_id, fromDate, toDate, product_id) => {

    let query = {

        Buyer : buyer_id
    };

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


    let buyerReceipts;

        
    buyerReceipts = await db.collection("logs").find(query).project({_id:0, __v:0}).toArray();


    return buyerReceipts;

}

module.exports = retrieveReceiptBuyer;