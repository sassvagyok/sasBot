import { Schema, model } from "mongoose";

export default model("szóharc-v2", new Schema({
    UserID: String,
    RecentWords: [String]
}));