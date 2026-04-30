import { Schema, model } from "mongoose";

export default model('servermoderations', new Schema({
    Guild: String,
    Count: Number
}));