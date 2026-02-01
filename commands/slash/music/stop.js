const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

module.exports = {
    name: "stop",
    description: "Lejátszás leállítása",
    info: "Zene lejátszásának leállítása, lejátszási sor törlése és kilépés a hangcsatornából. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        guildQueue.stop();
        guildQueue.voice.leave();

        const stopContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("🛑 Lejátszás leállítva"));
        
        interaction.reply({ components: [stopContainer], flags: MessageFlags.IsComponentsV2 });
    }
}