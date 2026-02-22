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

        const userThing = interaction.options.getString("tárgy");
   
        const things = ["kő", "papír", "olló"];
        const randomIndex = Math.floor(Math.random() * things.length);
        const myThing = things[randomIndex].charAt(0).toUpperCase() + things[randomIndex].slice(1)

        const rpcContainer = new ContainerBuilder()

        const returnResult = (result) => {
            const footerTextComponent = new TextDisplayBuilder();

            rpcContainer
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## \`${userThing.charAt(0).toUpperCase() + userThing.slice(1)}\` - \`${myThing.charAt(0).toUpperCase() + myThing.slice(1)}\``))
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

        if (userThing === "kő") {
            if (myThing === "kő") returnResult(2);
            if (myThing === "papír") returnResult(1);
            if (myThing === "olló") returnResult(0);
        } else if (userThing === "papír") {
            if (myThing === "kő") returnResult(0);
            if (myThing === "papír") returnResult(2);
            if (myThing === "olló") returnResult(1);
        } else if (userThing === "olló") {
            if (myThing === "kő") returnResult(1);
            if (myThing === "papír") returnResult(0);
            if (myThing === "olló") returnResult(2);
        }

        interaction.reply({ components: [rpcContainer], flags: MessageFlags.IsComponentsV2 });
    }
}