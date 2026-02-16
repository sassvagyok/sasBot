import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "previous",
    description: "Előző zenék lejátszása",
    info: "Előző zene lejátszása, vagy visszalépés megadott számú zenével. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "zenék",
            description: "Visszalépés ennyi zenével (üres: 1)",
            type: ApplicationCommandOptionType.Number,
            required: false,
            minValue: 1
        }
    ],
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const numberOfSongs = interaction.options.getNumber("zenék");

        const previousContainer = new ContainerBuilder()
        .setAccentColor(0x9327de);

        if (numberOfSongs) {
            if (numberOfSongs > guildQueue.previousSongs.length) return interaction.reply({ content: `Eddig lejátszott zenék: \`${guildQueue.previousSongs.length}\``, flags: MessageFlags.Ephemeral });
        
            guildQueue.jump(Math.abs(numberOfSongs) * -1);

            previousContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏮️ \`${numberOfSongs}\` zenével visszalépve`));
        } else if (guildQueue.previousSongs.length > 0) {
            guildQueue.previous();

            previousContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏮️ Visszalépve az előző zenére`));
        } else {
            return interaction.reply({ content: "Nincs előző zene!", flags: MessageFlags.Ephemeral });
        }
        
        interaction.reply({ components: [previousContainer], flags: MessageFlags.IsComponentsV2 });
    }
}