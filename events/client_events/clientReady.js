import mongoose from "mongoose";
import fs from "fs";
import moment from "moment";
import "moment-timezone";
import packageJson from "../../package.json" with { type: "json" };
import commandStatisticsSchema from "../../models/commandStatisticsModel.js";
import banTimer from "../../timers/banTimer.js";
import lockdownTimer from "../../timers/lockdownTimer.js";
import timeoutTimer from "../../timers/timeoutTimer.js";
import ötbetűTimer from "../../timers/ötbetűTimer.js";

export default {
    name: "clientReady",
    once: true,
    run: async (client) => {
        const getCurrentTime = () => moment().tz("Europe/Budapest").format("HH:mm:ss.SSS");
        
        const writeStatistics = async () => {
            if (!fs.existsSync("./statistics")) return;
        
            const commandStatisticsData = await commandStatisticsSchema.findOne();
        
            const filteredSlashStatistics = commandStatisticsData.Slash.map(({ Name, Uses }) => ({ Name, Uses })).sort((a, b) => b.Uses - a.Uses);
            const filteredContextStatistics = commandStatisticsData.Context.map(({ Name, Uses }) => ({ Name, Uses })).sort((a, b) => b.Uses - a.Uses);
        
            fs.writeFile("./statistics/stats_slash.json", JSON.stringify(filteredSlashStatistics, null, 4), err => {
                if (err) console.log(err);
            });
        
            fs.writeFile("./statistics/stats_context.json", JSON.stringify(filteredContextStatistics, null, 4), err => {
                if (err) console.log(err);
            });
        
            console.log(`[${getCurrentTime()}] Statisztikák kiírva`);
        }
        
        const startTimers = () => {
            banTimer(client);
            lockdownTimer(client);
            timeoutTimer(client);
            ötbetűTimer();
            
            console.log(`[${getCurrentTime()}] Timerek elindítva`);
        }
        
        const connectMongoose = async () => {
            if (process.env.mongooseConnectionString) {
                mongoose.set("strictQuery", false);
                await mongoose.connect(process.env.mongooseConnectionString).then(() => {
                    startTimers();
                    writeStatistics();
                    console.log(`[${getCurrentTime()}] ${client.user.username}@${packageJson.version} beindult ${client.guilds.cache.size} szerveren`);
                });
            
                console.log(`[${getCurrentTime()}] MongoDB csatlakoztatva`);
            } else {
                console.log("MongoDB csatlakozás nem található!");
                process.exit(1);
            }
        }
        
        connectMongoose();
    }
};