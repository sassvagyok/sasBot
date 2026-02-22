import { Schema, model } from "mongoose";

export default model('saspont', new Schema({
    Users: [
        {
            UserID: String,
            Username: String,
            OnLeaderboard: { type: Boolean, default: true },
            Balance: { type: Number, default: 5 },
            History: {
                type: [
                    {
                        Value: Number,
                        Origin: String,
                        Guild: String,
                        Date: String
                    }
                ],
                default: []
            },
            Casino: {
                Crash: {
                    Wins: { type: Number, default: 0 },
                    Losses: { type: Number, default: 0 },
                    MaxMult: { type: Number, default: null },
                    MaxWin: { type: Number, default: null },
                },
                Coinflip: {
                    Wins: { type: Number, default: 0 },
                    Losses: { type: Number, default: 0 },
                    MaxWin: { type: Number, default: null }
                }
            }
        }
    ]
}));