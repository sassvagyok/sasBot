const { Schema, model } = require('mongoose');

module.exports = model('command-disable', new Schema({
    Guild: String,
    Commands: [String]
}));