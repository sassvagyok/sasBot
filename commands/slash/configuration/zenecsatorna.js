import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";
import musicChannelSchema from "../../../models/musicchannelModel.js";

export default {
    name: "zenecsatorna",
    description: "Zene-csatorna kezelése",
    info: "Csatorna kezelése, ahol használható a zenelejátszás a szerveren (alapértelmezetten mindenhol).\n`Szükséges permission: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "beállítás",
            description: "Zene-csatorna beállítása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "csatorna",
                    description: "Csatorna, ahol a zene-parancsok használhatóak lesznek (kivétel: Lyrics)",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: true
                }
            ]
        },
        {
            name: "kikapcsolás",
            description: "Zene-csatorna követelmény kikapcsolása",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "beállított",
            description: "Beállított zene-csatorna megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();
        const csatorna = interaction.options.getChannel("csatorna");

        const musicChannelData = await musicChannelSchema.findOne({ Guild: interaction.guild.id });

        if (subCommand === "beállítás") {
            if (musicChannelData) await musicChannelSchema.findOneAndUpdate({ Guild: interaction.guild.id }, { Channel: csatorna.id });
            else {
                const newData = new musicChannelSchema({
                    Guild: interaction.guild.id,
                    Channel: csatorna.id
                });
                await newData.save();
            }

            interaction.reply({ content: `Új zene-csatorna: ${csatorna}` });
        }

        if (subCommand === "kikapcsolás") {
            if (musicChannelData) {
                await musicChannelSchema.findOneAndDelete({ Guild: interaction.guild.id });
                
                interaction.reply({ content: "Mostantól kezelhető a zenelejátszás minden csatornában" });
            } else interaction.reply({ content: "Nincs zene-csatorna beállítva!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "beállított") {
            if (musicChannelData) {
                const existingChannel = interaction.guild.channels.cache.get(musicChannelData.Channel);

                interaction.reply({ content: `Beállított zene-csatorna: ${existingChannel}` });      
            } else interaction.reply({ content: "Nincs zene-csatorna beállítva!", flags: MessageFlags.Ephemeral });
        }
    }
}