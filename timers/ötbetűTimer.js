import ötbetűSchema from "../models/ötbetűModel.js";
import allWords from "../data/words.json" with { type: "json" };
import cron from "node-cron";
import moment from "moment";
import "moment-timezone";

export default async () => {
    const updateWord = async () => {
        const filteredWords = allWords.filter(x => x.length === 5 && x[0].toUpperCase() !== x[0]);

        let ötbetűData = await ötbetűSchema.findOne();

        if (!ötbetűData || ötbetűData.length === 0) {
            const newData = new ötbetűSchema({
                Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD"),
                Word: filteredWords[Math.floor(Math.random() * filteredWords.length)],
                Users: []
            });
            await newData.save();

            console.log(`[${moment().tz("Europe/Budapest").format("HH:mm:ss")}] Napi szó frissítve`);
        } else {
            if (ötbetűData.Date !== moment().tz("Europe/Budapest").format("YYYY-MM-DD")) {
                await ötbetűSchema.findOneAndUpdate({
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD"),
                    Word: filteredWords[Math.floor(Math.random() * filteredWords.length)],
                    $set: { "Users.$[].Tries": 0, "Users.$[].Guessed": false, "Users.$[].Sequence": "" }
                });

                console.log(`[${moment().tz("Europe/Budapest").format("HH:mm:ss")}] Napi szó frissítve`);
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