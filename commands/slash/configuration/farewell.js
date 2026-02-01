const { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");
const farewellSchema = require("../../../models/farewellModel.js");

module.exports = {
    name: "farewell",
    description: "Búcsúüzenet kezelése",
    info: "Egyedi búcsúüzenet beállítása, törlése vagy megtekintése, ami a tagok kilépésekor a megadott csatornában lesz megjelenítve.\n`Szükséges jogosultság: Adminisztrátor`",
    has_embed: true,
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "beállítás",
            description: "Búcsúüzenet beállítása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "csatorna",
                    description: "Búcsúüzenet csatornája",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: true
                },
                {
                    name: "leírás",
                    description: "Búcsúüzenet leírása (Tag nevének kiírása: [tag])",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 1500
                },
                {
                    name: "cím",
                    description: "Búcsúüzenet címe (Tag nevének kiírása: [tag]) (üres: nincs)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 200
                },
                {
                    name: "fejléc",
                    description: "Búcsúüzenet fejléce (Tag nevének kiírása: [tag]) (üres: \"[tag] kilépett!\")",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 200
                },
                {
                    name: "kép",
                    description: "Búcsúüzenet képének linkje (üres: tag profilképe)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 500
                },
                {
                    name: "szín",
                    description: "Búcsúüzenet színe hex formátumban (pl. #ffffff) (üres: piros)",
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
                    description: "Megjelenjen a kilépés ideje? (üres: igaz)",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]  
        },
        {
            name: "kikapcsolás",
            description: "Búcsúüzenet kikapcsolása",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "beállított",
            description: "Beállított búcsúüzenet és csatorna megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "súgó",
            description: "Segítség a paraméterek jelentéséhez",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const farewellData = await farewellSchema.findOne({ Guild: interaction.guild.id });
        
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
            
            const farewellEmbed = new EmbedBuilder()
            .setDescription(replacedDescription);

            if (title) farewellEmbed.setTitle(replacedTitle);
            farewellEmbed.setThumbnail(thumbnail ? thumbnail : interaction.user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }));
            farewellEmbed.setColor(color ? color : "#E2162E");
            if (timestamp) farewellEmbed.setTimestamp();
            if (icon) farewellEmbed.setAuthor({ name: header ? replacedHeader : `${interaction.user.username} kilépett!`, iconURL: interaction.user.displayAvatarURL() });
            else farewellEmbed.setAuthor({ name: header ? replacedHeader : `${interaction.user.username} kilépett!` });

            return farewellEmbed;
        }

        if (subCommand === "beállítás") {
            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return interaction.reply({ content: "Szükségem van `Embed Links` jogosultságra a megadott csatornában!", flags: MessageFlags.Ephemeral });

            if (farewellData) {
                await farewellSchema.findOneAndUpdate({ Guild: interaction.guild.id },
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

                interaction.reply({ content: `Új búcsúüzenet beállítva ide: ${channel}:\n`, embeds: [createEmbed(description, title, header, thumbnail, color, icon, timestamp)] });
            } else {
                new farewellSchema({
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

                interaction.reply({ content: `Búcsúüzenet módosítva itt: ${channel}:\n`, embeds: [createEmbed(description, title, header, thumbnail, color, icon, timestamp)] });
            }
        }

        if (subCommand === "kikapcsolás") {
            if (farewellData) {
                await farewellSchema.findOneAndDelete({ Guild: interaction.guild.id });

                return interaction.reply({ content: "Búcsúüzenet kikapcsolva" });
            } else return interaction.reply({ content: "Nincs beállítva búcsúüzenet!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "beállított") {
            if (farewellData) return interaction.reply({ content: `Beállított búcsúüzenet itt: <#${farewellData.Channel}>:\n`, embeds: [createEmbed(farewellData.Description, farewellData.Title, farewellData.AuthorText, farewellData.Thumbnail, farewellData.Color, farewellData.Icon, farewellData.Timestamp)] });
            else return interaction.reply({ content: "Nincs beállítva búcsúüzenet!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "súgó") {
            const farewellEmbed = new EmbedBuilder()
            .setAuthor({ name: "⬅️ Ikon | Fejléc", iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }))
            .setTitle("Cím             Kép ➡️")
            .setDescription("Leírás")
            .setColor("#E2162E")
            .setTimestamp();

            return interaction.reply({ embeds: [farewellEmbed] });
        }
    }
}