import { Schema, model } from "mongoose";

export default model("szóharc", new Schema({
    Users: [
        {
            UserID: String,
            RecentWords: [String]
        }
    ]
}));