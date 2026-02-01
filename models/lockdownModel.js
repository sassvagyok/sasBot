const { Schema, model } = require('mongoose');

module.exports = model('lockdown', new Schema({
    Guild: String,
    Channel: String,
    Author: String,
    Length: String,
    Start: String,
    End: String
}));