const { Schema, model } = require('mongoose');

module.exports = model('music-channel', new Schema({
    Guild: String,
    Channel: String
}));