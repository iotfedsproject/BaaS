#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER0_CA=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem
# export ORDERER1_CA=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem

export PEER0_IOTFEDS_CA=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/ca.crt
export PEER1_IOTFEDS_CA=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/ca.crt
export PEER2_IOTFEDS_CA=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/ca.crt
export PEER3_IOTFEDS_CA=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/ca.crt

export PEER0_ORG3_CA=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/server.key

# export ORDERER1_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/server.crt
# export ORDERER1_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/server.key

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  local PEERNUM=$2
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  infoln "Using organization ${USING_ORG}"
  if [ $USING_ORG == "IoTFeds" ]; then
    if [ $PEERNUM -eq 0 ]; then
      export CORE_PEER_LOCALMSPID="iotfedsMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_IOTFEDS_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp
      export CORE_PEER_ADDRESS=localhost:7051

    elif [ $PEERNUM -eq 1 ]; then
      export CORE_PEER_LOCALMSPID="iotfedsMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_IOTFEDS_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp
      export CORE_PEER_ADDRESS=localhost:9051

    elif [ $PEERNUM -eq 2 ]; then
      export CORE_PEER_LOCALMSPID="iotfedsMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$PEER2_IOTFEDS_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp
      export CORE_PEER_ADDRESS=localhost:11051

    elif [ $PEERNUM -eq 3 ]; then
      export CORE_PEER_LOCALMSPID="iotfedsMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$PEER3_IOTFEDS_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp
      export CORE_PEER_ADDRESS=localhost:13051

    else
      errorln "Peer Unknown"
    fi
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
  else
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
  setGlobals $1 $2
  local PEERNUM=$2
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  if [ $USING_ORG == "IoTFeds" ]; then
    if [ $PEERNUM -eq 0 ]; then
      export CORE_PEER_ADDRESS=peer0.iotfeds.iti.gr:7051
    elif [ $PEERNUM -eq 1 ]; then
      export CORE_PEER_ADDRESS=peer1.iotfeds.iti.gr:9051
    elif [ $PEERNUM -eq 2 ]; then
      export CORE_PEER_ADDRESS=peer2.iotfeds.iti.gr:11051
    elif [ $PEERNUM -eq 3 ]; then
      export CORE_PEER_ADDRESS=peer3.iotfeds.iti.gr:13051
  fi
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_ADDRESS=peer0.org3.example.com:11051
  else
    errorln "ORG Unknown"
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  ORG=$1

  while [ "$#" -gt 0 ]; do
    setGlobals $1 0
    PEER="peer0.$1"
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	PEERS="$PEER"
    else
	PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
    ## Set path to TLS certificate
    if [ $ORG == "IoTFeds" ]; then
      CA=PEER0_IOTFEDS_CA
    else
      CA=PEER0_$1_CA # wrong but anyway... this should be always the case
    fi
    # CA=PEER0_$1_CA
    TLSINFO=(--tlsRootCertFiles "${!CA}")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}
