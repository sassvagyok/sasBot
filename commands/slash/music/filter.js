import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "filter",
    description: "Filterek hozzáadása a zenéhez",
    info: "Választható hangfilterek hozzáadása a zenékhez. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "filter",
            description: "Filter kiválasztása (üres: bekapcsolt filterek kiírása)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "Kikapcsolás",
                    value: "kikapcsolás"
                },
                {
                    name: "3D",
                    value: "3d"
                },
                {
                    name: "Bass Boost",
                    value: "bassboost"
                },
                {
                    name: "Echo",
                    value: "echo"
                },
                {
                    name: "Karaoke",
                    value: "karaoke"
                },
                {
                    name: "Nightcore",
                    value: "nightcore"
                },
                {
                    name: "Vaporwave",
                    value: "vaporwave"
                },
                {
                    name: "Flanger",
                    value: "flanger"
                },
                {
                    name: "Gate",
                    value: "gate"
                },
                {
                    name: "Haas",
                    value: "haas"
                },
                {
                    name: "Reverse",
                    value: "reverse"
                },
                {
                    name: "Surround",
                    value: "surround"
                },
                {
                    name: "Mcompand",
                    value: "mcompand"
                },
                {
                    name: "Phaser",
                    value: "phaser"
                },
                {
                    name: "Tremolo",
                    value: "tremolo"
                },
                {
                    name: "Earwax",
                    value: "earwax"
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });
        
        const filter = interaction.options.getString("filter");

        const filterContainer = new ContainerBuilder()
        .setAccentColor(0x9327de);

        if (!filter) {
            if (guildQueue.filters.size > 0) filterContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Bekapcsolt filterek:**\n${guildQueue.filters.names.map(char => `\`${char}\``).join(", ")}`));
            else return interaction.reply({ content: "Nincsenek bekapcsolt filterek!", flags: MessageFlags.Ephemeral });
        } else if (filter === "kikapcsolás") {
            if (guildQueue.filters.size > 0) {
                guildQueue.filters.clear();

                filterContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("❌ Filterek kikapcsolva"));
            } else return interaction.reply({ content: "Nincsenek bekapcsolt filterek!", flags: MessageFlags.Ephemeral });
        } else {
            guildQueue.filters.add(filter);

            filterContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Bekapcsolt filterek:**\n${guildQueue.filters.names.map(char => `\`${char}\``).join(", ")}`));
        }

        interaction.reply({ components: [filterContainer], flags: MessageFlags.IsComponentsV2 });
    }
}