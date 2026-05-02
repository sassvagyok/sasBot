import { ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, ButtonStyle } from "discord.js";

export default {
    name: "avatár",
    description: "Profilképek megjelenítése",
    info: "Saját, vagy megadott tag profilképének megjelenítése kiválasztható formátumban és felbontásban.",
    options: [
        {
            name: "tag",
            description: "Választott tag (üres: saját profilkép)",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "formátum",
            description: "A profilkép formátuma (üres: PNG)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "PNG",
                    value: "png"
                },
                {
                    name: "JPG",
                    value: "jpg"
                },
                {
                    name: "JPEG",
                    value: "jpeg"
                },
                {
                    name: "GIF",
                    value: "gif"
                },
                {
                    name: "WEBP",
                    value: "webp"
                }
            ]
        }
    ],
    run: async (client, interaction) => {
        
        const target = interaction.options.getUser("tag") || interaction.user;
        const format = interaction.options.getString("formátum") || "png";

        const fetchedUser = await target.fetch();

        const button256 = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("256")
        .setLabel("256x256");

        const button512 = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("512")
        .setLabel("512x512");

        const button1024 = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId("1024")
        .setLabel("1024x1024");

        const avatarButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(target.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }))
        .setEmoji("🎭")
        .setLabel("Link");

        const row = new ActionRowBuilder().addComponents(button256, button512, button1024, avatarButton);

        if (fetchedUser.banner) {
            const buttonBanner = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setEmoji("🖼️")
            .setLabel("Banner")
            .setURL(fetchedUser.bannerURL({ extension: "png", size: 1024, dynamic: true }));

            row.addComponents(buttonBanner);
        }

        const avatarGalleryComponent = new MediaGalleryBuilder()
        .addItems([
            {
                media: {
                    url: target.displayAvatarURL({ extension: format, size: 1024, dynamic: true })
                }
            }
        ]);

        const avatarContainer = new ContainerBuilder()
        .setAccentColor(fetchedUser.accentColor || 0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Avatár: \`${target.username}\``))
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(avatarGalleryComponent)
        .addActionRowComponents(row);

        const msg = await interaction.reply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });

        const filter = (buttonInteraction) => {
            if (buttonInteraction.user.id === interaction.user.id) return true;
            else buttonInteraction.deferUpdate();
        }

        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000
        });

        collector.on("collect", async (ButtonInteraction) => {
            const id = parseInt(ButtonInteraction.customId);

            const avatarGalleryComponent = new MediaGalleryBuilder()
            .addItems([
                {
                    media: {
                        url: target.displayAvatarURL({ extension: format, size: id, dynamic: true })
                    }
                }
            ]);

            avatarContainer.spliceComponents(2, 1, avatarGalleryComponent);

            row.components[0].setStyle(id === "256" ? ButtonStyle.Primary : ButtonStyle.Secondary);
            row.components[1].setStyle(id === "512" ? ButtonStyle.Primary : ButtonStyle.Secondary);
            row.components[2].setStyle(id === "1024" ? ButtonStyle.Primary : ButtonStyle.Secondary);

            await interaction.editReply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });
            await ButtonInteraction.deferUpdate();
        })

        collector.on("end", async () => {
            row.components[0].setDisabled(true);
            row.components[1].setDisabled(true);
            row.components[2].setDisabled(true);

            await interaction.editReply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });
        });
    }
}