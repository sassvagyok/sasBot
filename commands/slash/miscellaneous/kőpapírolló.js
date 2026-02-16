import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";

export default {
    name: "kőpapírolló",
    description: "Kő-Papír-Olló",
    info: "Hagyományos kő-papír-olló sasBot ellen.",
    options: [
        {
            name: "tárgy",
            description: "Mivel játszol?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "Kő",
                    value: "kő"
                },
                {
                    name: "Papír",
                    value: "papír"
                },
                {
                    name: "Olló",
                    value: "olló"
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        const option = interaction.options.getString("tárgy");
   
        const targyak = ["kő", "papír", "olló"];
        const veglegEnyem = Math.floor(Math.random() * targyak.length);

        const rpcContainer = new ContainerBuilder()

        const returnResult = (result) => {
            const footerTextComponent = new TextDisplayBuilder();

            rpcContainer
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## \`${option.charAt(0).toUpperCase() + option.slice(1)}\` - \`${targyak[veglegEnyem].charAt(0).toUpperCase() + targyak[veglegEnyem].slice(1)}\``))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
            .addTextDisplayComponents(footerTextComponent);

            if (result === 0) {
                footerTextComponent.setContent(`**${interaction.user.displayName} nyert!**`);
                rpcContainer.setAccentColor(0x19cc10);
            } else if (result === 1) {
                footerTextComponent.setContent(`**${client.user.displayName} nyert!**`);
                rpcContainer.setAccentColor(0xe2162e);
            } else {
                footerTextComponent.setContent("**Döntetlen!**");
                rpcContainer.setAccentColor(0x3d3d3d);
            }
        }

        if (option === "kő") {
            if (targyak[veglegEnyem] === "kő") returnResult(2);
            if (targyak[veglegEnyem] === "papír") returnResult(1);
            if (targyak[veglegEnyem] === "olló") returnResult(0);
        } else if (option === "papír") {
            if (targyak[veglegEnyem] === "kő") returnResult(0);
            if (targyak[veglegEnyem] === "papír") returnResult(2);
            if (targyak[veglegEnyem] === "olló") returnResult(1);
        } else if (option === "olló") {
            if (targyak[veglegEnyem] === "kő") returnResult(1);
            if (targyak[veglegEnyem] === "papír") returnResult(0);
            if (targyak[veglegEnyem] === "olló") returnResult(2);
        }

        interaction.reply({ components: [rpcContainer], flags: MessageFlags.IsComponentsV2 });
    }
}