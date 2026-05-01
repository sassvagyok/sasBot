import dailyOtbetuSchema from "../models/dailyOtbetuModel.js";
import userOtbetuSchema from "../models/userOtbetuModel.js";
import allWords from "../data/words.json" with { type: "json" };
import cron from "node-cron";
import moment from "moment";
import "moment-timezone";

export default async () => {
    const updateWord = async () => {
        const filteredWords = allWords.filter(x => x.length === 5 && x[0].toUpperCase() !== x[0]);

        let dailyOtbetuData = await dailyOtbetuSchema.findOne();

        if (!dailyOtbetuData) {
            const newData = new dailyOtbetuSchema({
                Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD"),
                Word: filteredWords[Math.floor(Math.random() * filteredWords.length)]
            });
            await newData.save();

            console.log(`[${moment().tz("Europe/Budapest").format("HH:mm:ss.SSS")}] Ötbetű szó létrehozva`);
        } else {
            if (dailyOtbetuData.Date !== moment().tz("Europe/Budapest").format("YYYY-MM-DD")) {
                await dailyOtbetuSchema.findOneAndUpdate({}, {
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD"),
                    Word: filteredWords[Math.floor(Math.random() * filteredWords.length)]
                });

                await userOtbetuSchema.updateMany({}, {
                    $set: { 
                        "Today.Tries": 0, 
                        "Today.Guessed": false, 
                        "Today.Sequence": "" 
                    }
                });

                const yesterday = moment().tz("Europe/Budapest").startOf('day').subtract(1, 'days').toDate();

                await userOtbetuSchema.updateMany(
                    { LastWonOn: { $lt: yesterday, $ne: null } },
                    { $set: { Streak: 0 } }
                );

                console.log(`[${moment().tz("Europe/Budapest").format("HH:mm:ss.SSS")}] Ötbetű szó frissítve`);
            }
        }
    }

    updateWord();

    cron.schedule(" * 0 * * *", async () => {
        await updateWord();
    }, {
        timezone: "Europe/Budapest"
    });
}