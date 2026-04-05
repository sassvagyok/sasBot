import { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, StringSelectMenuBuilder } from "discord.js";

export default {
    name: "feedback",
    description: "Visszajelzés küldése",
    info: "Hibák, észrevételek és javaslatok megosztása sasBot-tal kapcsolatban.",
    run: async (client, interaction) => {

        const typeMenu = new StringSelectMenuBuilder()
        .setCustomId("type")
        .setPlaceholder("Visszajelzés típusa")
        .addOptions(
            [
                { label: "Hiba", value: "bug", description: "Hiba jelentése" },
                { label: "Fejlesztés", value: "improvement", description: "Meglévő funkció fejlesztése" },
                { label: "Új funkció", value: "addition", description: "Új funkció ajánlása" }
            ]
        );

        const subjectInput = new TextInputBuilder()
        .setCustomId("subject")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(150);

        const bodyInput = new TextInputBuilder()
        .setCustomId("body")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

        const type = new LabelBuilder()
        .setId(1)
        .setLabel("Típus")
        .setStringSelectMenuComponent(typeMenu);

        const subject = new LabelBuilder()
        .setId(2)
        .setLabel("Tárgy (max. 150 karakter)")
        .setTextInputComponent(subjectInput);

        const body = new LabelBuilder()
        .setId(3)
        .setLabel("Leírás (max. 500 karakter)")
        .setTextInputComponent(bodyInput);

        const mainModal = new ModalBuilder()
        .setCustomId("feedback")
        .setTitle("Visszajelzés küldése")
        .addLabelComponents(type, subject, body);

        interaction.showModal(mainModal);
    }
}