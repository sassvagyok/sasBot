import { ApplicationCommandOptionType } from "discord.js";

export default {
    name : "emojify",
    description : "Emoji-szöveg készítése",
    info: "Választott szöveg emoji-szöveggé alakítása.",
    options: [
        {
            name: "szöveg",
            description: "Kiírandó szöveg",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1500
        }
    ],
    run: async(client, interaction) => {

        let emojifiedText = "";
        const text = interaction.options.getString("szöveg");

        const chars = {
            char0: ":zero:",
            char1: ":one:",
            char2: ":two:",
            char3: ":three:",
            char4: ":four:",
            char5: ":five:",
            char6: ":six:",
            char7: ":seven:",
            char8: ":eight:",
            char9: ":nine:",
            "char+": ":heavy_plus_sign:",
            "char-": ":heavy_minus_sign:",
            "char*": ":asterisk:",
            "char÷": ":heavy_division_sign:",
            "char#": ":hash:",
            "char!": `:exclamation:`,
            "char?": `:question:`
        };
        
        for (let e of text) {
            if (/([a-z])/gim.test(e)) emojifiedText += `:regional_indicator_${e.toLowerCase()}:`;
            else if (/\s/.test(e)) emojifiedText += ":blue_square:";
            else if (/([0-9])/.test(e) || ["+", "-", "*", "#", "!", "÷", "?"].includes(e)) emojifiedText += chars[`char${e}`];
            else emojifiedText += e;
        }

        interaction.reply({ content: emojifiedText });
    }
}