import { PermissionFlagsBits, ChannelType, ContainerBuilder, TextDisplayBuilder, MessageFlags, ButtonBuilder, ActionRowBuilder, SeparatorBuilder, ButtonStyle } from "discord.js";
import modsettingSchema from "../models/modsettingModel.js";
import customCommandSchema from "../models/customcommandModel.js";
import config from "../config.json" with { type: "json" };

export default {
    name: "guildCreate",
    run: async (client, guild) => {
        const registerCustomcommands = async () => {
            customCommandSchema.find({ Guild: guild.id }).then(data => {
                data.forEach((cmd) => {
                    guild.commands.create({
                    name: cmd.Command,
                    description: "Egyedi parancs ezen a szerveren" 
                }).catch(error => { });
                });
            });
        }

        const sendIntroductionMessage = () => {
            const channel = guild.channels.cache.filter(x => x.type === ChannelType.GuildText && x.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)).first();

            if (!channel) return;
            
            const gitButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(client.config.githubURL)
            .setLabel("Github");

            const supportServerButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(client.config.supportURL)
            .setLabel("Szerver");

            const docsButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(config.docsURL)
            .setLabel("Dokumentáció");

            const row = new ActionRowBuilder().addComponents(gitButton, supportServerButton, docsButton);

            const introContainer = new ContainerBuilder()
            .setAccentColor(0x1d88ec)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Köszönöm, hogy hozzáadtál a szerverhez!\n- Az összes parancs és leírásuk: </help összes:1338161979352813617>\n- Visszajelzés küldése: </feedback:1338161979684159601>"))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
            .addActionRowComponents(row);

            channel.send({ components: [introContainer], flags: MessageFlags.IsComponentsV2 });
        }

        const createModsettingsEntry = async () => {
            const modsettingData = await modsettingSchema.findOne({ Guild: guild.id });

            if (modsettingData) return;

            const newData = new modsettingSchema({
                Guild: guild.id,
                DM: true,
                Log: true,
                Send: true
            });
            await newData.save();
        }

        registerCustomcommands();
        sendIntroductionMessage();
        createModsettingsEntry();
    }
};