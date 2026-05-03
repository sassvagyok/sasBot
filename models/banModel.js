import { Schema, model } from "mongoose";

export default model('ban', new Schema({
    Guild: String,
    Channel: String,
    User: String,
    Author: String,
    Length: String,
    Start: Date,
    End: Date,
    Number: Number,
    Reason: String
}));