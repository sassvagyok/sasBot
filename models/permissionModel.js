const { Schema, model } = require('mongoose');

module.exports = model('permissions-v2', new Schema({
    Guild: String,
    Commands: [
        {
            Name: String,
            Roles: [String]
        }
    ]
}));