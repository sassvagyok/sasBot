import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import moment from "moment";
import "moment-duration-format";

export default {
    name: "seek",
    description: "Tekerés a zenében",
    info: "Megadott másodperchez való ugrás a jelenleg lejátszott zenében. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "másodperc",
            description: "Ugrás ehhez a másodperchez",
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 0
        }
    ],
    run: async (client, interaction) => {

        const seconds = interaction.options.getNumber("másodperc");
        
        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const previousTime = guildQueue.currentTime;

        await guildQueue.seek(seconds);

        let duration = moment.duration(seconds, "seconds");
        let formattedDuration = duration.format("hh:mm:ss", {
            trim: ""
        });

        if (duration.hours() === 0) formattedDuration = formattedDuration.replace(/^00:/, "");

        const seekContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${previousTime > guildQueue.currentTime ? "⏪" : "⏩"} Lejátszás innen: \`${formattedDuration}\``));
        
        interaction.reply({ components: [seekContainer], flags: MessageFlags.IsComponentsV2 });
    }
}