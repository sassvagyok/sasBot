const { Schema, model } = require('mongoose');

module.exports = model('timeout', new Schema({
    Guild: String,
    Channel: String,
    User: String,
    Author: String,
    Length: String,
    Start: String,
    End: String,
    Number: Number
}));