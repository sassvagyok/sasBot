import { Schema, model } from "mongoose";

export default model('command-stats', new Schema({
    Slash: [
        {
            Name: String,
            Uses: Number
        }
    ],
    Context: [
        {
            Name: String,
            Uses: Number
        }
    ]
}));