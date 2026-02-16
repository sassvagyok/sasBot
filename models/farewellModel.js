import { Schema, model } from "mongoose";

export default model('farewell-v2', new Schema({
    Guild: String,
    Channel: String,
    AuthorText: String,
    Title: String,
    Description: String,
    Color: String,
    Thumbnail: String,
    Icon: Boolean,
    Timestamp: Boolean
}));