import { Schema, model } from "mongoose";

export default model('music-channel', new Schema({
    Guild: String,
    Channel: String
}));