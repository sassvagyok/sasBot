const { Schema, model } = require('mongoose');

module.exports = model('welcome-v2', new Schema({
    Guild: String,
    Channel: String,
    AuthorText: String,
    Title: String,
    Description: String,
    Color: String,
    Thumbnail: String,
    Icon: Boolean,
    Timestamp: Boolean
}));