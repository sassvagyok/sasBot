import { AttachmentBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";

export default {
    name: "miatyánk",
    description: "Bűnbocsánat",
    info: "Ha valamilyen bűnt hordozol magadon, ez a parancs segít(het).",
    run: async (client, interaction) => {

        const attachment = new AttachmentBuilder("media/miatyánk.mp4");

        if (interaction.channel.type !== 1 && !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.AttachFiles)) return interaction.reply({ content: "Ma nincs bocsánat! Nincs jogom ehhez: `Attach Files`!", flags: MessageFlags.Ephemeral }); 
        
        interaction.reply({ files: [attachment] });
    }
}