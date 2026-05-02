import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";

export default {
    name: "8ball",
    description: "Bízd rám a sorsod",
    info: "Ha nem vagy biztos egy kérdésben, most megerősítést nyerhetsz.",
    options: [
        {
            name: "kérdés",
            description: "Mire keresed a választ?",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1500
        }
    ],
    run: async (client, interaction) => {

        let question = interaction.options.getString("kérdés");
        question.endsWith("?") ? "" : question += "?";

        const replies = [
            "Biztosan",
            "Kétségtelenül",
            "Kétség nélkül",
            "Egyértelműen",
            "Számíthatsz rá",
            "Ahogy én látom, igen",
            "Valószínűleg",
            "Jók a kilátások",
            "Igen",
            "A jelek szerint igen",
            "Homályos válasz, próbáld újra",
            "Kérdezz meg később",
            "Jobb, ha nem tudod meg",
            "Most nem tudom megmondani",
            "Koncentrálj, és kérdezz újra",
            "Ne számíts rá",
            "Nem",
            "Forrásaim szerint nem",
            "Nem jók a kilátások",
            "Erősen kétséges"
        ];

        const randomIndex = Math.floor(Math.random() * replies.length);
        const randomReply = replies[randomIndex];

        const ballContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.username}: \`${question}\``))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🔮 ${randomReply} 🔮`));

        interaction.reply({ components: [ballContainer], flags: [MessageFlags.IsComponentsV2] });
    }
}