const { Schema, model } = require('mongoose');

module.exports = model('prefix', new Schema({
    Guild: String,
    Prefixes: [String]
}));