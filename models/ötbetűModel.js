const { Schema, model } = require('mongoose');

module.exports = model('ötbetű-v3', new Schema({
    Date: String,
    Word: String,
    Users: [
        {
            UserID: String,
            Tries: Number,
            Guessed: Boolean,
            Sequence: String,
            Stats: {
                Games: Number,
                Wins: Number,
                Best: {
                    Tries: Number,
                    Date: String
                }
            }
        }
    ]
}));