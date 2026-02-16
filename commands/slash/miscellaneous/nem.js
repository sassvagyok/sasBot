import { ApplicationCommandOptionType } from "discord.js";

export default {
    name: "nem",
    description: "Nem kérdeztem",
    info: "Ha úgy érzed, valakit nem kérdeztek. Címezhető.",
    dm_permission: false,
    options: [
        {
            name: "tag",
            description: "Kinek üzened? (üres: akárkinek)",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {

        const target = interaction.options.getUser("tag");

        if (target) interaction.reply({ content: `nem kérdeztem, ${target}` });
        else interaction.reply({ content: "nem kérdeztem" });
    }
}