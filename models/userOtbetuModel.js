import { Schema, model } from "mongoose";

export default model('userotbetu', new Schema({
    UserID: String,
    Today: {
        Tries: Number,
        Guessed: Boolean,
        Sequence: String,
    },
    Stats: {
        GamesPlayed: Number,
        Wins: Number,
    },
    BestGame: {
        Tries: Number,
        Date: String
    },
    Streak: { type: Number, default: 0 },
    LastWonOn: { type: Date, default: null },
}));