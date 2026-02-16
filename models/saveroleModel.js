import { Schema, model } from "mongoose";

export default model('saveroles', new Schema({
    Guild: String,
    Users: [
        {
            UID: String,
            Roles: [String]
        }
    ]
}));