const { ApplicationCommandOptionType, MessageFlags } = require("discord.js");
const figlet = require("figlet");
const fonts = require("../../../data/ascii.json");

module.exports = {
    name: "ascii",
    description: "ASCII-kép készítése szövegből",
    info: "Beírt szöveg ASCII-képpé alakítása, opcionálisan betűtípus választással: https://pastebin.com/AVsvB8Ju.",
    options: [
        {
            name: "szöveg",
            description: "Kiírandó szöveg",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "betűtípus",
            description: "Összes betűtípus: https://pastebin.com/AVsvB8Ju (üres: alapértelmezett)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    run: async(client, interaction) => {

        const msg = interaction.options.getString("szöveg");
        let chosenFont = interaction.options.getString("betűtípus");

        if (chosenFont) chosenFont = fonts.find(x => x.toLowerCase() == chosenFont.toLowerCase());

        figlet.text(msg, { font: chosenFont ? chosenFont : "" }, function (err, data) {
            if (!data) return interaction.reply({ content: "Összes betűtípus: https://pastebin.com/AVsvB8Ju", flags: MessageFlags.Ephemeral });
            if (err) return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
            if (data.length > 1994) return interaction.reply({ content: "A végső üzenet hoszabb, mint 2000 karakter!" });

            if (data) {
                interaction.reply({ content: `\`\`\`${data}\`\`\`` });
            } else {
                return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
            } 
        });
    }
}