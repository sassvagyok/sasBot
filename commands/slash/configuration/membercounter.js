import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";
import membercounterSchema from "../../../models/membercounterModel.js";

export default {
    name: "membercounter",
    description: "Tagokat számláló csatorna kezelése",
    info: "Tagokat számláló csatorna létrehozása, beállított csatorna átnevezése, vagy törlése.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "beállítás",
            description: "Tagokat számláló csatorna létrehozása, vagy átnevezése",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "név",
                    description: "Új csatorna neve, vagy meglévő tagszámláló új neve",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 50
                }
            ]
        },
        {
            name: "kikapcsolás",
            description: "Tagok számlálásának kikapcsolása (csatorna törlése nélkül)",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const membercounterData = await membercounterSchema.findOne({ Guild: interaction.guild.id });
        const subCommand = interaction.options.getSubcommand();
        const channelName = interaction.options.getString("név");
        const members = interaction.guild.memberCount;

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Nincs jogom ehhez: `Manage Channels`!", flags: MessageFlags.Ephemeral });

        if (subCommand === "beállítás") {
            if (membercounterData && interaction.guild.channels.cache.get(membercounterData.Channel)) {
                if (!interaction.guild.channels.cache.get(membercounterData.Channel).permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Nincs jogom ehhez: `Manage Channels`!", flags: MessageFlags.Ephemeral });
                interaction.guild.channels.cache.get(membercounterData.Channel).setName(`${channelName}: ${members}`);
    
                await membercounterSchema.findOneAndUpdate({ Guild: interaction.guild.id }, { Name: channelName });
                interaction.reply({ content: "Tagszámláló csatorna átnevezve" });
            } else {
                if (membercounterData) await membercounterSchema.findOneAndDelete({ Guild: interaction.guild.id });
    
                const channel = await interaction.guild.channels.create({
                    name: `${channelName}: ${members}`,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.Connect]
                        },
                        {
                            id: interaction.guild.members.me,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
    
                const newData = new membercounterSchema({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    Member: members,
                    Name: channelName
                });
                await newData.save();
    
                interaction.reply({ content: `Tagszámláló csatorna létrehozva (${channel})` });
            }
        }

        if (subCommand === "kikapcsolás") {
            if (membercounterData) {
                await membercounterSchema.findOneAndDelete({ Guild: interaction.guild.id });

                interaction.reply({ content: "Tagszámlálás kikapcsolva" });
            } else interaction.reply({ content: "Nincs beállított tagszámláló csatorna!", flags: MessageFlags.Ephemeral });
        }
    }
}