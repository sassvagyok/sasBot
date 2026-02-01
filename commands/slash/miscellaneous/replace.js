const { ApplicationCommandOptionType } = require("discord.js")

module.exports = {
    name: "replace",
    description: "Karakterek kicserélése egy szövegben",
    info: "Karakterek kicserélése egy másikra a megadott szövegben. Szóköz: \\s",
    options: [
        {
            name: "kicserélendő",
            description: "Kicserélendő karakter(ek) (szóköz: \\s)",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "új",
            description: "Új karakter(ek) (szóköz: \\s)",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "szöveg",
            description: "Szöveg, amiben ki lesznek cserélve a karakterek",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1500
        },
        {
            name: "vizsgálás",
            description: "Kis- és nagybetűk megkülönböztetése (üres: nem)",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    run: async (client, interaction) => {

        const text = interaction.options.getString("szöveg");
        const toReplace = interaction.options.getString("kicserélendő").split(" ")[0];
        const newCharacter = interaction.options.getString("új").split(" ")[0];
        let caseSensitive = interaction.options.getBoolean("vizsgálás") || false;

        caseSensitive ? caseSensitive = "g" : caseSensitive = "gi";

        interaction.reply({ content: text.replace(new RegExp(toReplace, caseSensitive), newCharacter) });
    }
}