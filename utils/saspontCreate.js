import saspontSchema from "../models/saspontModel.js";
import config from "../config.json" with { type: "json" };

export default async (user) => {
    let saspontData = await saspontSchema.findOne({ UserID: user.id });

    if (!saspontData) {
        const newData = new saspontSchema({
            UserID: user.id,
            Username: user.username
        });
        await newData.save();
    } else {
        saspontData.Balance += config.commandSaspontGain || 25;

        if (saspontData.Username !== user.username) saspontData.Username = user.username;

        await saspontData.save();
    }
}