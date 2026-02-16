import { Schema, model } from "mongoose";

export default model('modsetting-v2', new Schema({
    Guild: String,
    DM: Boolean,
    Log: Boolean,
    Send: Boolean
}));