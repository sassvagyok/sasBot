import { Schema, model } from "mongoose";

export default model('moderations', new Schema({
    Guild: String,
    User: String,
    Count: Number,
    Bans: [
        {
            Number: Number,
            Date: String,
            Target: String,
            Author: String,
            Reason: String,
            Length: String,
            Type: String,
        }
    ],
    Kicks: [
        {
            Number: Number,
            Date: String,
            Target: String,
            Author: String,
            Reason: String,
            Type: String,
        }
    ],
    Timeouts: [
        {
            Number: Number,
            Date: String,
            Target: String,
            Author: String,
            Reason: String,
            Length: String,
            Type: String,
        }
    ],
    Warns: [
        {
            Number: Number,
            Date: String,
            Target: String,
            Author: String,
            Reason: String,
            Type: String,
        }
    ]
}));