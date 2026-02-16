import { Schema, model } from "mongoose";

export default model('lockdown', new Schema({
    Guild: String,
    Channel: String,
    Author: String,
    Length: String,
    Start: String,
    End: String
}));