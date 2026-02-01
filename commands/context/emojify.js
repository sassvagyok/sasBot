const { ApplicationCommandType, MessageFlags } = require("discord.js");

module.exports = {
    name: "Emojify",
    type: ApplicationCommandType.Message,
    dm_permission: false,
    run: async (client, interaction) => {

        const text = await interaction.channel.messages.fetch(interaction.targetId);
        if (!text.content) return interaction.reply({ content: "A kijelölt üzenet nem változtatható emojivá!", flags: MessageFlags.Ephemeral });

        let sentence = "";

        let chars = {
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
        
        for (let e of text.content) {
            if (/([a-z])/gim.test(e)) sentence += `:regional_indicator_${e.toLowerCase()}:`;
            else if (/\s/.test(e)) sentence += ":blue_square:";
            else if (/([0-9])/.test(e) || ["+", "-", "*", "#", "!", "÷", "?"].includes(e)) sentence += chars[`char${e}`];
            else sentence += e;
        }

        interaction.reply({ content: sentence });
    }
}