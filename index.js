import { Client, Collection, GatewayIntentBits, Partials, ActivityType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import config from "./data/config.json" with { type: "json" };
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

client.commands = new Collection();
client.slashCommands = new Collection();
client.contextMenuCommands = new Collection();
client.config = config;

commandHandler(client);