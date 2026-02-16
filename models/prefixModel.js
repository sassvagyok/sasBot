import { Schema, model } from "mongoose";

export default model('prefix', new Schema({
    Guild: String,
    Prefixes: [String]
}));