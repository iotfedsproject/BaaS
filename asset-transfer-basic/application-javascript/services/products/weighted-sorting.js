var sortedProductList = [];
const random_factor = 1/3;

function weightedRandom(items, weights){

  let sortedList;

    if (items.length !== weights.length) {
      throw new Error('Items and weights must be of the same size');
    }
  
    if (!items.length) {
      return 
    }

    // console.log("Items:", items)
  
    // Preparing the cumulative weights array.
    // For example:
    // - weights = [1, 4, 3]
    // - cumulativeWeights = [1, 5, 8]
    const cumulativeWeights = [];
    for (let i = 0; i < weights.length; i += 1) {
      cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
      console.log("cumulativeWeights", cumulativeWeights)
    }
  
    // Getting the random number in a range of [0...sum(weights)]
    // For example:
    // - weights = [1, 4, 3]
    // - maxCumulativeWeight = 8
    // - range for the random number is [0...8]
    const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
    let sortedProducts;
    if (items.Resource_id){
      sortedProducts = items.sort((a, b) => b.overallReputation/maxCumulativeWeight - a.overallReputation/maxCumulativeWeight);
    }
    else{
      sortedProducts = items.sort((a, b) => b.Reputation/maxCumulativeWeight - a.Reputation/maxCumulativeWeight);
    }
    // const sortedProducts = items.sort((a, b) => b.Reputation/maxCumulativeWeight - a.Reputation/maxCumulativeWeight);
    const randomNumber =  maxCumulativeWeight * Math.random() * random_factor;
    console.log("random number ", randomNumber)

    // Picking the random item based on its weight.
    // The items with higher weight will be picked more often.
    for (let itemIndex = 0; itemIndex < sortedProducts.length; itemIndex += 1) {
      if (cumulativeWeights[itemIndex] >= randomNumber) {
        // sortedProductList.push(items[itemIndex].Resource_id);
        sortedProductList.push(items[itemIndex]);
        console.log("HERE:",sortedProductList)
        // console.log("Item index",itemIndex)
        
        //Remove sorted item & his weights from the list
        items.splice(itemIndex, 1);
        weights.splice(itemIndex, 1);

        sortedList = sortedProductList;
        

        //Sort the list again
        weightedRandom(items, weights);

      }

      
    }
    // let sortedList = sortedProductList;
    sortedProductList = [];
    // console.log("In here items are :", sortedList )

    return  sortedList ;
  }


  // function returnSortedList(items, weights){

  //   let sortedList = weightedRandom(items, weights)
  // }


// weightedRandom(productList, productList.map(product => product.rep_score));
// console.log(sortedProductList);


module.exports = weightedRandom;