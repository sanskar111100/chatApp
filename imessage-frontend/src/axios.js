const axios = require("axios");

const instance = axios.create({
    baseURL: 'http://localhost:9000'
})

module.exports = instance