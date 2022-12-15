#!/bin/bash
cd ../../test-network
export PATH=${PWD}/../bin:$PATH
echo "$PWD"
export FABRIC_CFG_PATH=$PWD/../config/
echo "$FABRIC_CFG_PATH"



source scripts/utils.sh
. scripts/envVar.sh
# . scripts/configUpdate.sh



Org=${1}
CHANNEL=${2}
CRL=${3}

# Takes an original and modified config, and produces the config update tx
# which transitions between the two
# NOTE: this must be run in a CLI container since it requires configtxlator 
createConfigUpdate() {
  CHANNEL=$1
  ORIGINAL=$2
  MODIFIED=$3
  OUTPUT=$4


  set -x
  configtxlator proto_encode --input "${ORIGINAL}" --type common.Config >${dir}/original_config.pb
  configtxlator proto_encode --input "${MODIFIED}" --type common.Config >${dir}/modified_config.pb
  configtxlator compute_update --channel_id "${CHANNEL}" --original ${dir}/original_config.pb --updated ${dir}/modified_config.pb >config_update.pb
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >${dir}/config_update.json
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL'", "type":2}},"data":{"config_update":'$(cat ${dir}/config_update.json)'}}}' | jq . >${dir}/config_update_in_envelope.json
  configtxlator proto_encode --input ${dir}/config_update_in_envelope.json --type common.Envelope >"${OUTPUT}"
  { set +x; } 2>/dev/null
  res=$?
  verifyResult $res "The creation of the update failed."
  successln "The updated has been created!"
}

# signConfigtxAsPeerOrg <org> <configtx.pb>
# Set the peerOrg admin of an org and sign the config update
signConfigtxAsPeerOrg() {
  ORG=$1
  CONFIGTXFILE=$2
  setGlobals $ORG
  set -x
  peer channel signconfigtx -f "${CONFIGTXFILE}"
  { set +x; } 2>/dev/null
  res=$?
  verifyResult $res "Signing the update has failed"
  successln "The updated has been signed by org ${ORG}!"
}


revokeuser(){

  ORG=$1
  CHANNEL=$2
  PEERNUM=$3
  CRL=$4
  OUTPUT=mychannel_config.json
  dir="$PWD/scripts/configupdates" 


  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "Created directory for storing config updates"

  else
    echo "Directory already exists"

  fi



#  fetchChannelConfig ${ORG} ${CHANNEL} ${PEERNUM} mychannel_config.json 

  setGlobals $ORG $PEERNUM
  infoln "The org is ${ORG}"
  infoln "The channel is ${CHANNEL}"
  infoln "Fetching the most recent configuration block for the channel"
  set -x
  peer channel fetch config ${dir}/config_block.pb -o localhost:7050  --ordererTLSHostnameOverride orderer0.orderer.iti.gr -c $CHANNEL --tls --cafile "$ORDERER0_CA"
  { set +x; } 2>/dev/null
  res=$?
  verifyResult $res "Fetching channel config block has failed"
  successln "The channel config block has been fetched"

  infoln "Decoding config block to JSON and isolating config to ${dir}/${OUTPUT}"
  set -x
  configtxlator proto_decode --input ${dir}/config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${dir}/${OUTPUT}"
  { set +x; } 2>/dev/null

  jq --arg new ${CRL} '.channel_group.groups.Application.groups.'${ORG,,}'MSP.values.MSP.value.config.revocation_list? += [$new]' ${dir}/mychannel_config.json > "${dir}"/modified_config.json
  # jq --arg new ${CRL} '.channel_group.groups.Application.groups.authMSP.values.MSP.value.config.revocation_list? += [$new]' mychannel_config.json > modified_config.json

  createConfigUpdate ${CHANNEL} ${dir}/mychannel_config.json ${dir}/modified_config.json ${dir}/crl_update_envelope.pb

  # signConfigtxAsPeerOrg AUTH ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg UNS ${dir}/crl_update_envelope.pb 
  signConfigtxAsPeerOrg EXTR ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg HCS ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg UOA ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg UNITOV ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg GOC ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg DISBA ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg VIS ${dir}/crl_update_envelope.pb 
  # signConfigtxAsPeerOrg IDIBAPS ${dir}/crl_update_envelope.pb 


  peer channel update -f ${dir}/crl_update_envelope.pb -c ${CHANNEL} -o localhost:7050 --ordererTLSHostnameOverride orderer0.orderer.iti.gr --tls --cafile "$ORDERER0_CA"

  successln "The update was successfully submitted!"
}


verifyResult() {
	if [ $1 -ne 0 ] ; then
		fatalln "$2"
	fi
}

setGlobalsCLI $Org 0
revokeuser ${Org} ${CHANNEL} 0 ${CRL}