#!/bin/bash


function createIoTFeds() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/iotfeds.iti.gr/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-iotfeds --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-iotfeds.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-iotfeds.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-iotfeds.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-iotfeds.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-iotfeds --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  #---------- NEW PEER --------#
  infoln "Registering peer1"
  set -x
  fabric-ca-client register --caname ca-iotfeds --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  #---------- NEW PEER --------#
  infoln "Registering peer2"
  set -x
  fabric-ca-client register --caname ca-iotfeds --id.name peer2 --id.secret peer2pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  #---------- NEW PEER --------#
  infoln "Registering peer3"
  set -x
  fabric-ca-client register --caname ca-iotfeds --id.name peer3 --id.secret peer3pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  # infoln "Registering user"
  # set -x
  # fabric-ca-client register --caname ca-iotfeds --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  # { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-iotfeds --id.name IoTFedsadmin --id.secret IoTFedsadminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/msp" --csr.hosts peer0.iotfeds.iti.gr --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/msp/config.yaml"

  #---------- NEW PEER --------#
  infoln "Generating the peer1 msp"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/msp" --csr.hosts peer1.iotfeds.iti.gr --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/msp/config.yaml"


 #---------- NEW PEER --------#
  infoln "Generating the peer2 msp"
  set -x
  fabric-ca-client enroll -u https://peer2:peer2pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/msp" --csr.hosts peer2.iotfeds.iti.gr --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/msp/config.yaml"


 #---------- NEW PEER --------#
  infoln "Generating the peer3 msp"
  set -x
  fabric-ca-client enroll -u https://peer3:peer3pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/msp" --csr.hosts peer3.iotfeds.iti.gr --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/msp/config.yaml"


  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls" --enrollment.profile tls --csr.hosts peer0.iotfeds.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/keystore/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca/tlsca.iotfeds.iti.gr-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer0.iotfeds.iti.gr/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca/ca.iotfeds.iti.gr-cert.pem"

  #---------- NEW PEER --------#
  infoln "Generating the peer1-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls" --enrollment.profile tls --csr.hosts peer1.iotfeds.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/keystore/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca/tlsca.iotfeds.iti.gr-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer1.iotfeds.iti.gr/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca/ca.iotfeds.iti.gr-cert.pem"



  #---------- NEW PEER --------#
  infoln "Generating the peer2-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer2:peer2pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls" --enrollment.profile tls --csr.hosts peer2.iotfeds.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/keystore/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca/tlsca.iotfeds.iti.gr-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer2.iotfeds.iti.gr/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca/ca.iotfeds.iti.gr-cert.pem"



  #---------- NEW PEER --------#
  infoln "Generating the peer3-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer3:peer3pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls" --enrollment.profile tls --csr.hosts peer3.iotfeds.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/keystore/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/tlsca/tlsca.iotfeds.iti.gr-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca"
  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/peers/peer3.iotfeds.iti.gr/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/ca/ca.iotfeds.iti.gr-cert.pem"


  # infoln "Generating the user msp"
  # set -x
  # fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/User1@iotfeds.iti.gr/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  # { set +x; } 2>/dev/null

  # cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/User1@iotfeds.iti.gr/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://IoTFedsadmin:IoTFedsadminpw@localhost:7054 --caname ca-iotfeds -M "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/IoTFeds/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/msp/config.yaml" "${PWD}/organizations/peerOrganizations/iotfeds.iti.gr/users/Admin@iotfeds.iti.gr/msp/config.yaml"
}



function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/orderer.iti.gr

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/orderer.iti.gr

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/config.yaml"

  infoln "Registering orderer0"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer0 --id.secret orderer0pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  # infoln "Registering orderer1"
  # set -x
  # fabric-ca-client register --caname ca-orderer --id.name orderer1 --id.secret orderer1pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  # { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the orderer 0 msp"
  set -x
  fabric-ca-client enroll -u https://orderer0:orderer0pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/msp" --csr.hosts orderer0.orderer.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/msp/config.yaml"

  # infoln "Generating the orderer 1 msp"
  # set -x
  # fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/msp" --csr.hosts orderer1.orderer.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  # { set +x; } 2>/dev/null

  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/msp/config.yaml"

  infoln "Generating the orderer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer0:orderer0pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls" --enrollment.profile tls --csr.hosts orderer0.orderer.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/ca.crt"
  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/server.crt"
  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/server.key"

  mkdir -p "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem"

  mkdir -p "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer0.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem"

  # infoln "Generating the orderer1-tls certificates"
  # set -x
  # fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls" --enrollment.profile tls --csr.hosts orderer1.orderer.iti.gr --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  # { set +x; } 2>/dev/null

  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/ca.crt"
  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/server.crt"
  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/server.key"

  # mkdir -p "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/msp/tlscacerts"
  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem"

  # mkdir -p "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/tlscacerts"
  # cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/orderers/orderer1.orderer.iti.gr/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/tlscacerts/tlsca.orderer.iti.gr-cert.pem"


  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/users/Admin@orderer.iti.gr/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/Orderer/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/orderer.iti.gr/users/Admin@orderer.iti.gr/msp/config.yaml"
}
