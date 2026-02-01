const { Schema, model } = require('mongoose');

module.exports = model('dj-role', new Schema({
    Guild: String,
    Role: String,
}));