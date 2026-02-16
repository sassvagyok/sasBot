import { Schema, model } from "mongoose";

export default model('autorole', new Schema({
    Guild: String,
    Roles: [String]
}));