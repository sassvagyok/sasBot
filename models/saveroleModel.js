const { Schema, model } = require('mongoose');

module.exports = model('saveroles', new Schema({
    Guild: String,
    Users: [
        {
            UID: String,
            Roles: [String]
        }
    ]
}));