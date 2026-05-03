import { Schema, model } from "mongoose";

export default model('dailyotbetu', new Schema({
    Date: Date,
    Word: String
}));