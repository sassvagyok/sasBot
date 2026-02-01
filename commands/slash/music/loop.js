const { ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

module.exports = {
    name: "loop",
    description: "Ismétlési mód állítása",
    info: "Ismétlés beállítása a jelenlegi zenére, lejátszási sorra vagy kikapcsolása. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "mód",
            description: "Ismétlés módja (üres: gombos állítás megjelenítése)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "Jelenlegi zene ismétlése",
                    value: "be"
                },
                {
                    name: "Lejátszási sor ismétlése",
                    value: "queue"
                },
                {
                    name: "Ismétlés kikapcsolása",
                    value: "ki"
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const loop = interaction.options.getString("mód");

        if (loop === "be") guildQueue.setRepeatMode(1);
        if (loop === "ki") guildQueue.setRepeatMode(0);
        if (loop === "queue") guildQueue.setRepeatMode(2);

        const offButton = new ButtonBuilder()
        .setStyle(guildQueue.repeatMode === 0 ? "Primary" : "Secondary")
        .setCustomId("ki")
        .setLabel("Kikapcsolva");

        const onButton = new ButtonBuilder()
        .setStyle(guildQueue.repeatMode === 1 ? "Primary" : "Secondary")
        .setCustomId("be")
        .setLabel("Jelenlegi zene");

        const queueButton = new ButtonBuilder()
        .setStyle(guildQueue.repeatMode === 2 ? "Primary" : "Secondary")
        .setCustomId("queue")
        .setLabel("Lejátszási sor");
        
        const row = new ActionRowBuilder().addComponents(offButton, onButton, queueButton);

        const loopContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Ismétlés módja:"))
        .addActionRowComponents(row);

        const msg = await interaction.reply({ components: [loopContainer], flags: MessageFlags.IsComponentsV2 });

        const filter = (buttonInteraction) => {
            if (buttonInteraction.user.id === interaction.member.id) return true;
            else buttonInteraction.deferUpdate();
        }

        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000
        });

        collector.on("collect", async (ButtonInteraction) => {
            const id = ButtonInteraction.customId;

            if (!interaction.member.voice.channel) return interaction.deferUpdate();
            if (!interaction.member.voice.channel.id === interaction.guild.members.me.voice.channel.id) return interaction.deferUpdate();
            if (!guildQueue.playing) return ButtonInteraction.deferUpdate();

            if (id == "ki") {
                if (guildQueue.repeatMode === 0) return ButtonInteraction.deferUpdate();

                guildQueue.setRepeatMode(0);

                row.components[0].setStyle("Primary");
                row.components[1].setStyle("Secondary");
                row.components[2].setStyle("Secondary");
            }

            if (id == "be") {
                if (guildQueue.repeatMode === 1) return ButtonInteraction.deferUpdate();

                guildQueue.setRepeatMode(1);

                row.components[0].setStyle("Secondary");
                row.components[1].setStyle("Primary");
                row.components[2].setStyle("Secondary");
            }

            if (id == "queue") {
                if (guildQueue.repeatMode === 2) return ButtonInteraction.deferUpdate();

                guildQueue.setRepeatMode(2);

                row.components[0].setStyle("Secondary");
                row.components[1].setStyle("Secondary");
                row.components[2].setStyle("Primary");
            }

            await interaction.editReply({ components: [loopContainer], flags: MessageFlags.IsComponentsV2 });
            await ButtonInteraction.deferUpdate();
        });

        collector.on("end", async () => {
            row.components[0].setDisabled(true);
            row.components[1].setDisabled(true);
            row.components[2].setDisabled(true);

            await interaction.editReply({ components: [loopContainer], flags: MessageFlags.IsComponentsV2 });
        });
    }
}