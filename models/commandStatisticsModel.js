const { Schema, model } = require('mongoose');

module.exports = model('command-stats', new Schema({
    Slash: [
        {
            Name: String,
            Uses: Number
        }
    ],
    Context: [
        {
            Name: String,
            Uses: Number
        }
    ]
}));