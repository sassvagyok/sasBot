import { ApplicationCommandType, MessageFlags } from "discord.js";

export default {
    name: "Echo",
    type: ApplicationCommandType.Message,
    dm_permission: false,
    run: async (client, interaction) => {
        
        const msg = await interaction.channel.messages.fetch(interaction.targetId);

        if (!msg.content) return interaction.reply({ content: "A kijelölt üzenet nem küldhető el újra!", flags: MessageFlags.Ephemeral });
        
        interaction.reply({ content: msg.content });
    }
}