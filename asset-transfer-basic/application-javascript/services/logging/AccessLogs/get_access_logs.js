const retrieveAccessLogs = require('../../../MongoDB/controllers/retrieveAccessLogs');

const getAccessLogs = async(req, res, next) => {

    let user = req.body.user;
    let product_id = req.body.product_id;
    let fromDate = req.body.fromDate;
    let toDate = req.body.toDate;

    // For pagination if/when needed

    //     let pageLength = + req.body.pageLength;
    //     let currentPage = + req.body.currentPage;

    const isValidfromDate = !isNaN(Date.parse(fromDate)) ? true : false;
    const isValidtoDate = !isNaN(Date.parse(toDate)) ? true : false;
   

    try {   

        // if (!user) {

        //     throw new Error ("Malformed request");
        // }

        if ((fromDate && !isValidfromDate)) {

            throw new Error ("Malformed request. Not a valid date");

        }

        if ((toDate && !isValidtoDate)) {

            throw new Error ("Malformed request.Not a valid date.");
        }

        let accessLogs = await retrieveAccessLogs(user, fromDate, toDate, product_id);

        res.status(200).send({"Logs": accessLogs});
    
    }

    catch(error){
        
        console.log(`Retrieve logs operation failed with error: `+error);
        
        if (error.toString().includes('Malformed request')){

            res.status(400).send({error: 'Retrieve logs operation failed ...'+error})
        }
        else{

            res.status(500).send({error: 'Retrieve logs operation failed ...'+error})
        }
        
    }
}

module.exports = getAccessLogs;