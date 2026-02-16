import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import allWords from "../../../data/words.json" with { type: "json" };

export default {
    name: "szókeresés",
    description: "Szavak keresése",
    info: "Magyar szavak keresése néhány kezdőbetű megadásával.",
    options: [
        {
            name: "szó",
            description: "Keresett szavak kezdő karakterei",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "vizsgálat",
            description: "Keresés az egész szóban (üres/hamis: csak a szó elején)",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    run: async (client, interaction) => {

        const szo = interaction.options.getString("szó").split(" ")[0];
        const searchAll = interaction.options.getBoolean("vizsgálat") || false;

        const filteredWords = allWords.filter(x => searchAll ? x.includes(szo) : x.startsWith(szo));
        let foundWords = "";
        let foundWordCount = 0;

        for (let i = 0; i < filteredWords.length; i++) {
            if (foundWords.length > 0) foundWords += ", "
            if (foundWords.length + filteredWords[i].length > 1924) {
                foundWords += `+${filteredWords.length - foundWordCount}`
                break;
            } else {
                foundWords += filteredWords[i];
                foundWordCount++;
            }
        }
        
        if (foundWords.length === 0) return interaction.reply({ content: "Egy találat sincs!", flags: MessageFlags.Ephemeral });

        interaction.reply({ content: `\`\`\`${foundWords}\`\`\`` });
    }
}