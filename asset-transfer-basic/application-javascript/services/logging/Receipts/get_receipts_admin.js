const retrieveReceiptAdmin = require('../../../MongoDB/controllers/retrieveReceiptsAdmin');

const getReceiptsByAdmin = async(req, res, next) => {

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

        if ((fromDate && !isValidfromDate)) {

            throw new Error("Malformed request");
        }

        if ((toDate && !isValidtoDate)) {

            throw new Error("Malformed request");
        }

        let receipts = await retrieveReceiptAdmin(user, fromDate, toDate, product_id);

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

module.exports = getReceiptsByAdmin;