const { Schema, model } = require('mongoose');

module.exports = model('autorole', new Schema({
    Guild: String,
    Roles: [String]
}));