const { Schema, model } = require('mongoose');

module.exports = model('modlog', new Schema({
    Guild: String,
    Channel: String
}));