import { Schema, model } from "mongoose";
import config from "../config.json" with { type: "json" };

export default model('saspont-v2', new Schema({
    UserID: String,
    Username: String,
    OnLeaderboard: { type: Boolean, default: true },
    Balance: { type: Number, default: config.commandSaspontGain || 25 },
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
    },
    Games: {
        Otbetu: {
            MaxWin: { type: Number, default: null },
        },
        Szoharc: {
            MaxWin: { type: Number, default: null },
        }
    }
}));