import { Client, Collection, GatewayIntentBits, Partials, ActivityType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { DisTube } from "distube";
import { YouTubePlugin } from "@distube/youtube";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { SpotifyPlugin } from "@distube/spotify";
import { YtDlpPlugin } from "@distube/yt-dlp";
import { readdirSync, statSync } from "fs";
import { pathToFileURL } from "url";
import config from "./config.json" with { type: "json" };
import commandHandler from "./handler/commandHandler.js";
import "dotenv/config";

const client = new Client({
    presence: {
        status: "online",
            activities: [{
                name: config.status,
                type: ActivityType.Playing
            }]
    },
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.GuildMember
    ]
});

const distube = new DisTube(client, {
    plugins: [
        new YouTubePlugin(),
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin()
    ],
    emitNewSongOnly: false
});

export default client;

process.on("unhandledRejection", error => {
	console.error("Unhandled promise rejection:", error);
    
    const errorContainerPrivate = new ContainerBuilder()
    .setAccentColor(0xe2162e)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${error.stack.length > 1900 ? `${error.stack.slice(0, 1900)}...` : error.stack}\`\`\``));

    const guild = client.guilds.cache.get(process.env.devServerId);
    if (!guild) return;
    const channel = guild.channels.cache.get(process.env.errorChannelId);
    if (!channel) return;

    channel.send({ components: [errorContainerPrivate], flags: MessageFlags.IsComponentsV2 });
});

const loadEvents = async (dir) => {
    const files = readdirSync(dir);

    for (const file of files) {
        const fullPath = `${dir}/${file}`;

        if (statSync(fullPath).isDirectory()) {
            await loadEvents(fullPath);
        } else if (file.endsWith(".js")) {
            const event = await import(pathToFileURL(fullPath).href);
            const { default: e } = event;
            const emitter = e.distube ? client.distube : client;

            if (e.once) {
                emitter.once(e.name, (...args) => e.run(client, ...args));
            } else {
                emitter.on(e.name, (...args) => e.run(client, ...args));
            }
        }
    }
};

client.commands = new Collection();
client.slashCommands = new Collection();
client.contextMenuCommands = new Collection();
client.config = config;
client.distube = distube;

await loadEvents("./events");

commandHandler(client);