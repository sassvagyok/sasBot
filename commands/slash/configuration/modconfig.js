import { PermissionFlagsBits, MessageFlags, ApplicationCommandOptionType, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import logChannelSchema from "../../../models/logchannelModel.js";

export default {
    name: "modconfig",
    description: "sasBot által végzett moderációk beállításai",
    info: "sasBot által végzett moderációk viselkedéseinek konfigurálása (üzenetküldés a csatornába, moderációk mentése, privát üzenetküldés), log-csatorna kezelése és beállítások megjelenítése.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "konfigurálás",
            description: "sasBot-moderációk konfigurálása",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "küldés",
                    description: "sasBot-moderációk üzenetküldésének konfigurálása",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "bekapcsolás",
                            description: "Legyenek a sasBot által végzett moderációkról üzenetek küldve? (alapértelmezett: igen)",
                            type: ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                },
                {
                    name: "mentés",
                    description: "sasBot-moderációk mentésének konfigurálása",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "bekapcsolás",
                            description: "El legyenek a sasBot által végzett moderációk mentve? (alapértelmezett: igen)",
                            type: ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                },
                {
                    name: "dm",
                    description: "sasBot-moderációk privát üzenetküldésének konfigurálása",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "bekapcsolás",
                            description: "Legyenek a sasBot által végzett moderációk elküldve az érintett tagnak? (alapértelmezett: igen)",
                            type: ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                }
            ]
        },
        {
            name: "logcsatorna",
            description: "sasBot-moderációk logcsatornájának konfigurációja",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "beállítás",
                    description: "sasBot-moderációk naplózásának konfigurálása",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "csatorna",
                            description: "Az a csatorna, ahová küldve legyenek a sasBot-moderációk (függetlenül az üzenetküldés beállításától)",
                            type: ApplicationCommandOptionType.Channel,
                            channelTypes: [ChannelType.GuildText],
                            required: true
                        }
                    ]  
                },
                {
                    name: "kikapcsolás",
                    description: "sasBot-moderációk naplózásának kikapcsolása",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        },
        {
            name: "beállítások",
            description: "sasBot-moderációk beállításainak megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        let sendsetting, logsetting, dmsetting, logchannel;
        const subCommand = interaction.options.getSubcommand();
        const subCommandGroup = interaction.options.getSubcommandGroup();

        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const logChannelData  = await logChannelSchema.findOne({ Guild: interaction.guild.id });

        if (!modsettingData) return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });

        if (subCommandGroup === "konfigurálás") {
            if (subCommand === "küldés") {
                sendsetting = interaction.options.getBoolean("bekapcsolás");

                await modsettingSchema.findOneAndUpdate({ Guild: interaction.guild.id, Send: sendsetting });
    
                interaction.reply({ content: sendsetting ? "Üzenetküldés bekapcsolva" : "Üzenetküldés kikapcsolva" });
            }
    
            if (subCommand === "mentés") {
                logsetting = interaction.options.getBoolean("bekapcsolás");

                await modsettingSchema.findOneAndUpdate({ Guild: interaction.guild.id, Log: logsetting });
    
                interaction.reply({ content: logsetting ? "Mentés bekapcsolva" : "Mentés kikapcsolva" });
            }
    
            if (subCommand === "dm") {
                dmsetting = interaction.options.getBoolean("bekapcsolás");

                await modsettingSchema.findOneAndUpdate({ Guild: interaction.guild.id, DM: dmsetting });
    
                interaction.reply({ content: dmsetting ? "Privát üzenetküldés bekapcsolva" : "Privát üzenetküldés kikapcsolva" });
            }
        }

        if (subCommandGroup === "logcsatorna") {
            if (subCommand === "beállítás") {
                logchannel = interaction.options.getChannel("csatorna");

                if (logChannelData) await logChannelSchema.findOneAndUpdate({ Guild: interaction.guild.id, Channel: logchannel.id });
                else {
                    new logChannelSchema({
                        Guild: interaction.guild.id,
                        Channel: logchannel.id
                    }).save();
                }
    
                interaction.reply({ content: `Új log-csatorna: ${logchannel}` });
            }
    
            if (subCommand === "kikapcsolás") {
                if (logChannelData) {
                    await logChannelSchema.findOneAndDelete({ Guild: interaction.guild.id });
    
                    return interaction.reply({ content: "Naplózás log-csatornába kikapcsolva" });
                } else return interaction.reply({ content: "Nincs beállítva log-csatorna!", flags: MessageFlags.Ephemeral });
            }
        }

        if (subCommand === "beállítások") {
            const modconfigContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### sasBot-moderálás konfigurációja"))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Moderációk elmentése:** \`${modsettingData.Log ? "Bekapcsolva" : "Kikapcsolva"}\`\n- **Üzenetküldés csatornába:** \`${modsettingData.Send ? "Bekapcsolva" : "Kikapcsolva"}\`\n- **Privát üzenetküldés:** \`${modsettingData.DM ? "Bekapcsolva" : "Kikapcsolva"}\`\n- **Log-csatorna:** ${logChannelData ? `<#${logChannelData.Channel}>` : "Nincs beállítva"}`));

            interaction.reply({ components: [modconfigContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}