import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "skip",
    description: "Zenék átugrása",
    info: "Ugrás a következő zenére, vagy megadott számú zene átugrása. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "zenék",
            description: "Ennyi zene átugrása (üres: 1)",
            type: ApplicationCommandOptionType.Number,
            required: false,
            minValue: 1
        }
    ],
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const numberOfSongs = interaction.options.getNumber("zenék");

        const skipContainer = new ContainerBuilder()
        .setAccentColor(0x9327de);

        if (numberOfSongs) {
            if (numberOfSongs > guildQueue.songs.length) return interaction.reply({ content: `A lejátszási sorban lévő zenék: \`${guildQueue.songs.length - 1}\``, flags: MessageFlags.Ephemeral });

            guildQueue.jump(numberOfSongs);

            skipContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏭️ \`${numberOfSongs}\` zene átugorva`));
        } else {
            if (guildQueue.songs[1]) {
                guildQueue.skip();
                
                skipContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("⏭️ Zene átugorva"));
            } else {
                if (!guildQueue.autoplay) {
                    guildQueue.stop();
                    guildQueue.voice.leave();

                    skipContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("🛑 Nincs következő zene, lejátszás leállítva"));
                } else {
                    guildQueue.skip();

                    skipContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("⏭️ Zene átugorva, automatikus lejátszás..."));
                }
            }
        }

        interaction.reply({ components: [skipContainer], flags: MessageFlags.IsComponentsV2 });
    }
}