const { AttachmentBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    name: "sadstory",
    description: "Szomorú történet (?)",
    info: "Sírni emberi dolog, bár a történet mégsem olyan szomorú?",
    run: async (client, interaction) => {

        const attachment1 = new AttachmentBuilder("media/ifelldown.mp4");
        const attachment2 = new AttachmentBuilder("media/igetup.mp4");

        if (interaction.channel.type !== 1 && !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.AttachFiles)) return interaction.reply({ content: "Most nem kell szomorkodni! Nincs jogom ehhez: `Attach Files`!", flags: MessageFlags.Ephemeral });
        
        interaction.reply({ files: [attachment1, attachment2] });
    }
}