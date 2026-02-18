import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export default {
    name: "feedback",
    description: "Visszajelzés küldése",
    info: "Hibák, észrevételek és javaslatok megosztása sasBot-tal kapcsolatban.",
    run: async (client, interaction) => {

        const mainModal = new ModalBuilder()
        .setCustomId("fb")
        .setTitle("Visszajelzés küldése");

        const subject = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Tárgy (max. 200 karakter)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200);

        const content = new TextInputBuilder()
        .setCustomId("desc")
        .setLabel("Leírás (max. 1000 karakter)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

        const subjectActionRow = new ActionRowBuilder().addComponents(subject);
		const contentActionRow = new ActionRowBuilder().addComponents(content);

        mainModal.addComponents(subjectActionRow, contentActionRow);

        interaction.showModal(mainModal);
    }
}