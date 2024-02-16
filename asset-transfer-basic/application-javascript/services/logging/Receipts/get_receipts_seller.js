const retrieveReceiptSeller = require('../../../MongoDB/controllers/retrieveReceiptsSeller');

const getReceiptsBySeller = async(req, res, next) => {

    let user = req.body.user;
    let product_id = req.body.product_id;
    let fromDate = req.body.fromDate;
    let toDate = req.body.toDate;

    // For pagination if/when needed

    //     let pageLength = + req.body.pageLength;
    //     let currentPage = + req.body.currentPage;

    const isValidfromDate = !isNaN(Date.parse(fromDate)) ? true : false;
    const isValidtoDate = !isNaN(Date.parse(toDate)) ? true : false;
    console.log(isValidfromDate)
    console.log( isValidtoDate )

    

    try {   

        if (!user) {

            throw new Error ("Malformed request. User does not exist.");
        }

        if ((fromDate && !isValidfromDate)) {

            throw new Error("Malformed request. Not a valid date.");
        }

        if ((toDate && !isValidtoDate)) {

            throw new Error("Malformed request. Not a valid date");
        }

        let receipts = await retrieveReceiptSeller(user, fromDate, toDate, product_id);

        res.status(200).send({"Receipts": receipts});
    
    }

    catch(error){
        
        console.log(`Retrieve receipts operation failed with error: `+error);

        if (error.toString().includes('Malformed request')){

            res.status(400).send({error: 'Retrieve receipts operation failed ...'+error})
        }
        else{

            res.status(500).send({error: 'Retrieve receipts operation failed ...'+error})
        }
    }
}

module.exports = getReceiptsBySeller;