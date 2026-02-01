const { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");
const welcomeSchema = require("../../../models/welcomeModel.js");

module.exports = {
    name: "welcome",
    description: "Üdvözlő üzenet kezelése",
    info: "Egyedi üdvözlő üzenet beállítása, törlése vagy megtekintése, ami a tagok csatlakozásakor a megadott csatornában lesz megjelenítve.\n`Szükséges jogosultság: Adminisztrátor`",
    has_embed: true,
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "beállítás",
            description: "Üdvözlő üzenet beállítása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "csatorna",
                    description: "Üdvözlő üzenet csatornája",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: true
                },
                {
                    name: "leírás",
                    description: "Üdvözlő üzenet leírása (Tag nevének kiírása: [tag])",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 1500
                },
                {
                    name: "cím",
                    description: "Üdvözlő üzenet címe (Tag nevének kiírása: [tag]) (üres: nincs)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 200
                },
                {
                    name: "fejléc",
                    description: "Üdvözlő üzenet fejléce (Tag nevének kiírása: [tag]) (üres: \"[tag] belépett!\")",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 200
                },
                {
                    name: "kép",
                    description: "Üdvözlő üzenet képének linkje (üres: tag profilképe)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 500
                },
                {
                    name: "szín",
                    description: "Üdvözlő üzenet színe hex formátumban (pl. #ffffff) (üres: zöld)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 7
                },
                {
                    name: "ikon",
                    description: "Megjelenjen a fejléc mellett a tag profilképe? (üres: igaz)",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                },
                {
                    name: "timestamp",
                    description: "Megjelenjen a belépés ideje? (üres: igaz)",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]  
        },
        {
            name: "kikapcsolás",
            description: "Üdvözlő üzenet kikapcsolása",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "beállított",
            description: "Beállított üdvözlő üzenet és csatorna megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "súgó",
            description: "Segítség a paraméterek jelentéséhez",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const welcomeData  = await welcomeSchema.findOne({ Guild: interaction.guild.id });

        const channel = interaction.options.getChannel("csatorna");
        const description = interaction.options.getString("leírás");
        const title = interaction.options.getString("cím");
        const header = interaction.options.getString("fejléc");
        const thumbnail = interaction.options.getString("kép");
        const color = interaction.options.getString("szín");
        const icon = interaction.options.getBoolean("ikon");
        const timestamp = interaction.options.getBoolean("timestamp");

        const subCommand = interaction.options.getSubcommand();

        const createEmbed = (description, title, header, thumbnail, color, icon, timestamp) => {
            const replacedDescription = description?.replace("[tag]", interaction.user.username);
            const replacedTitle = title?.replace("[tag]", interaction.user.username);
            const replacedHeader = header?.replace("[tag]", interaction.user.username);
            
            const welcomeEmbed = new EmbedBuilder()
            .setDescription(replacedDescription);

            if (title) welcomeEmbed.setTitle(replacedTitle);
            welcomeEmbed.setThumbnail(thumbnail ? thumbnail : interaction.user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }));
            welcomeEmbed.setColor(color ? color : "#17BC0F");
            if (timestamp) welcomeEmbed.setTimestamp();
            if (icon) welcomeEmbed.setAuthor({ name: header ? replacedHeader : `${interaction.user.username} belépett!`, iconURL: interaction.user.displayAvatarURL() });
            else welcomeEmbed.setAuthor({ name: header ? replacedHeader : `${interaction.user.username} belépett!` });

            return welcomeEmbed;
        }

        if (subCommand === "beállítás") {
            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return interaction.reply({ content: "Szükségem van `Embed Links` jogosultságra a megadott csatornában!" });

            if (welcomeData) {
                await welcomeSchema.findOneAndUpdate({ Guild: interaction.guild.id },
                    {
                        Channel: channel.id,
                        Description: description,
                        Title: title,
                        AuthorText: header,
                        Color: color,
                        Thumbnail: thumbnail,
                        Icon: icon,
                        Timestamp: timestamp
                    }
                );

                interaction.reply({ content: `Új üdvözlő üzenet beállítva ide: ${channel}:\n`, embeds: [createEmbed(description, title, header, thumbnail, color, icon, timestamp)] });
            } else {
                new welcomeSchema({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    Description: description,
                    Title: title,
                    AuthorText: header,
                    Color: color,
                    Thumbnail: thumbnail,
                    Icon: icon,
                    Timestamp: timestamp
                }).save();

                interaction.reply({ content: `Üdvözlő üzenet módosítva itt: ${channel}:\n`, embeds: [createEmbed(description, title, header, thumbnail, color, icon, timestamp)] });
            }
        }

        if (subCommand === "kikapcsolás") {
            if (welcomeData) {
                await welcomeSchema.findOneAndDelete({ Guild: interaction.guild.id });

                return interaction.reply({ content: "Üdvözlő üzenet kikapcsolva" });
            } else return interaction.reply({ content: "Nincs beállítva üdvözlő üzenet!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "beállított") {
            if (welcomeData) return interaction.reply({ content: `Beállított üdvözlő üzenet itt: <#${welcomeData.Channel}>:\n`, embeds: [createEmbed(welcomeData.Description, welcomeData.Title, welcomeData.AuthorText, welcomeData.Thumbnail, welcomeData.Color, welcomeData.Icon, welcomeData.Timestamp)] });
            else return interaction.reply({ content: "Nincs beállítva üdvözlő üzenet!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "súgó") {
            const welcomeEmbed = new EmbedBuilder()
            .setAuthor({ name: "⬅️ Ikon | Fejléc", iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }))
            .setTitle("Cím             Kép ➡️")
            .setDescription("Leírás")
            .setColor("#17BC0F")
            .setTimestamp();

            return interaction.reply({ embeds: [welcomeEmbed] });
        }
    }
}