./network.sh down
sleep 3
./network.sh up createChannel -c mychannel -ca
sleep 3
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
sleep 3
./network.sh deployCC -ccn federationsmanage -ccp ../asset-transfer-basic/chaincode-Feds/ -ccl javascript
