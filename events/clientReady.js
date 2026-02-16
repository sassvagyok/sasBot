import client from "../index.js";
import mongoose from "mongoose";
import fs from "fs";
import moment from "moment";
import"moment-timezone";
import packageJson from "../package.json" with { type: "json" };
import commandStatisticsSchema from "../models/commandStatisticsModel.js";
import banTimer from "../timers/banTimer.js";
import lockdownTimer from "../timers/lockdownTimer.js";
import timeoutTimer from "../timers/timeoutTimer.js";
import ötbetűTimer from "../timers/ötbetűTimer.js";

const currentTime = () => moment().tz("Europe/Budapest").format("HH:mm:ss");

const startup = async () => {
    client.on("ready", () =>
        console.log(`[${currentTime()}] ${client.user.username}@${packageJson.version} beindult (${client.guilds.cache.size})`)
    );
}

const getStatistics = async () => {
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

    console.log(`[${currentTime()}] Statisztikák kiírva`);
}

const startTimers = () => {
    client.once("ready", () => {
        banTimer(client);
        lockdownTimer(client);
        timeoutTimer(client);
        ötbetűTimer();
        
        console.log(`[${currentTime()}] Timerek elindítva`)
    });
}

const mongooseConnect = async () => {
    if (!process.env.mongooseConnectionString) return console.log(`[${currentTime()}] MongoDB nem található`);

    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.mongooseConnectionString).then(() => {
        startup();
        startTimers();
        getStatistics();
    });
    
    console.log(`[${currentTime()}] MongoDB csatlakoztatva`);
}

mongooseConnect();