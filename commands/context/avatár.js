const { ActionRowBuilder, ButtonBuilder, ApplicationCommandType, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder } = require("discord.js");

module.exports = {
    name: "Avatár",
    type: ApplicationCommandType.User,
    dm_permission: false,
    run: async (client, interaction) => {

        const user = await client.users.fetch(interaction.targetId);
        const fetchedUser = await user.fetch();

        const button256 = new ButtonBuilder()
        .setStyle("Secondary")
        .setCustomId("256")
        .setLabel("256x256");

        const button512 = new ButtonBuilder()
        .setStyle("Secondary")
        .setCustomId("512")
        .setLabel("512x512");

        const button1024 = new ButtonBuilder()
        .setStyle("Primary")
        .setCustomId("1024")
        .setLabel("1024x1024");

        const avatarButton = new ButtonBuilder()
        .setStyle("Link")
        .setURL(user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true }))
        .setEmoji("🎭")
        .setLabel("Link");

        const row = new ActionRowBuilder().addComponents(button256, button512, button1024, avatarButton);

        if (fetchedUser.banner) {
            const buttonBanner = new ButtonBuilder()
            .setStyle("Link")
            .setEmoji("🖼️")
            .setLabel("Banner")
            .setURL(fetchedUser.bannerURL({ extension: "png", size: 1024, dynamic: true }));

            row.addComponents(buttonBanner);
        }

        const avatarGalleryComponent = new MediaGalleryBuilder()
        .addItems([
            {
                media: {
                    url: user.displayAvatarURL({ extension: "png", size: 1024, dynamic: true })
                }
            }
        ]);

        const avatarContainer = new ContainerBuilder()
        .setAccentColor(fetchedUser.accentColor || 0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Avatár: \`${user.displayName}\``))
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(avatarGalleryComponent)
        .addActionRowComponents(row);

        const msg = await interaction.reply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });

        const filter = (buttonInteraction) => {
            if (buttonInteraction.user.id === interaction.member.id) return true;
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
                        url: user.displayAvatarURL({ extension: "png", size: id, dynamic: true })
                    }
                }
            ]);

            avatarContainer.spliceComponents(2, 1, avatarGalleryComponent);

            row.components[0].setStyle(id === "256" ? "Primary" : "Secondary");
            row.components[1].setStyle(id === "512" ? "Primary" : "Secondary");
            row.components[2].setStyle(id === "1024" ? "Primary" : "Secondary");
            
            await interaction.editReply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });
            await ButtonInteraction.deferUpdate();
        });

        collector.on("end", async () => {
            row.components[0].setDisabled(true);
            row.components[1].setDisabled(true);
            row.components[2].setDisabled(true);

            await interaction.editReply({ components: [avatarContainer], flags: MessageFlags.IsComponentsV2 });
        });
    }
}