const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient("mongodb://0.0.0.0:27017/");

const initDB = () => {
    mongoClient.connect().then(() => {
        console.log("Db connected");
    });
}

module.exports = initDB;
