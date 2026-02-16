import { Schema, model } from "mongoose";

export default model('custom-commands', new Schema({
    Guild: String,
    Command: String,
    Response: String
}));