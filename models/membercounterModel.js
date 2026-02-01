const { Schema, model } = require('mongoose');

module.exports = model('membercounter', new Schema({
    Guild: String,
    Channel: String,
    Member: String,
    Name: String
}));