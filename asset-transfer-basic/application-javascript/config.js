// require('dotenv').config()

const dev = {
    SERVER_PORT:8800,
    CLIENT_PORT:3000
    // MONGODB_URL:"mongodb://127.0.0.1:27017/logdb"
}

const prod = {
    SERVER_PORT:8800,
    CLIENT_PORT:3000
    // MONGODB_URL:"mongodb://127.0.0.1:27017/logdb"
}

const domain = process.env.NODE_ENV==='production'?prod:dev
module.exports = domain
