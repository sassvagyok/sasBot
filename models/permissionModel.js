import { Schema, model } from "mongoose";

export default model('permissions-v2', new Schema({
    Guild: String,
    Commands: [
        {
            Name: String,
            Roles: [String]
        }
    ]
}));