import { Schema, model } from "mongoose";

export default model('ötbetű-v3', new Schema({
    Date: String,
    Word: String,
    Users: [
        {
            UserID: String,
            Tries: Number,
            Guessed: Boolean,
            Streak: { type: Number, default: 0 },
            LastWonOn: { type: Date, default: null },
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