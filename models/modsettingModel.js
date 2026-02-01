const { Schema, model } = require('mongoose');

module.exports = model('modsetting-v2', new Schema({
    Guild: String,
    DM: Boolean,
    Log: Boolean,
    Send: Boolean
}));