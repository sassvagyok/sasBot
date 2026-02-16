import { Schema, model } from "mongoose";

export default model('command-disable', new Schema({
    Guild: String,
    Commands: [String]
}));