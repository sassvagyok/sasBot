import { Schema, model } from "mongoose";

export default model('dj-role', new Schema({
    Guild: String,
    Role: String,
}));