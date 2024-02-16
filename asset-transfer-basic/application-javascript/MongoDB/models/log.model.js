const mongoose = require('mongoose');

let log;

var logSchema = mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId,

    TransactionID: {
        type: String,
        required: true,
        unique: false
    },

    Buyer:{
        type: String,
        required: false,
        unique: false
    },

    Seller: {

        type: String,
        required: false,
        unique: false
    },

    User: {
        type: String,
        required: false,
        unique: false
    },

    ProductID: {
        type: String,
        required: true,
        unique: false
    },

    DateBought:{
        type: Date,
        required: false,
        unique: false
    },

    DateAccessed: {

        type: Date,
        required: false,
        unique: false
    }

   

})

log = mongoose.model('Log', logSchema)

module.exports = log;