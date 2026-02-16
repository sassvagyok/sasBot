import { Schema, model } from "mongoose";

export default model('membercounter', new Schema({
    Guild: String,
    Channel: String,
    Member: String,
    Name: String
}));