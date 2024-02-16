// require('dotenv').config()

const dev = {
    SERVER_PORT:3009,
    CLIENT_PORT:3008,
    MONGODB_URL:"mongodb://127.0.0.1:27017/iotfeds"
}

const prod = {
    SERVER_PORT:3009,
    CLIENT_PORT:3008,
    MONGODB_URL:"mongodb://127.0.0.1:27017/iotfeds"
}

const domain = process.env.NODE_ENV==='production'?prod:dev
module.exports = domain
