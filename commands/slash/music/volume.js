const { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

module.exports = {
    name: "volume",
    description: "Hangerő állítása",
    info: "Zene hangerejének változtatása maximum 500-ig (alapértelmezett: 50). (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "hangerő",
            description: "A lejátszás új hangereje (alapértelmezett: 50) (üres: beállított hangerő kiírása)",
            type: ApplicationCommandOptionType.Number,
            required: false,
            minValue: 1,
            maxValue: 500
        }
    ],
    run: async (client, interaction) => {

        const volume = interaction.options.getNumber("hangerő");

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const volumeContainer = new ContainerBuilder()
        .setAccentColor(0x9327de);

        if (!volume) {
            volumeContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔈 Hangerő: \`${guildQueue.volume}\``));
        } else {
            const previousVolume = guildQueue.volume;

            guildQueue.setVolume(volume);

            volumeContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${previousVolume > guildQueue.volume ? "🔉" : "🔊"} Új hangerő: \`${volume}\``));
        }

        interaction.reply({ components: [volumeContainer], flags: MessageFlags.IsComponentsV2 });
    }
}