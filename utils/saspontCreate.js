import saspontSchema from "../models/saspontModel.js";

export default async (user) => {
    let saspontData = await saspontSchema.findOne();

    if (!saspontData) {
        const newData = new saspontSchema({
            Users: []
        });
        await newData.save();

        saspontData = await saspontSchema.findOne();
    }
    
    let saspontUser = saspontData.Users.find(x => x.UserID === user.id);

    if (!saspontUser) {
        const new_user = {
            UserID: user.id,
            Username: user.username
        };

        saspontData.Users.push(new_user);
        await saspontData.save();
    } else {
        saspontUser.Balance += 5;

        if (saspontUser.Username !== user.username) saspontUser.Username = user.username;

        await saspontData.save();
    }
}