import { Schema, model } from "mongoose";

export default model('modlog', new Schema({
    Guild: String,
    Channel: String
}));