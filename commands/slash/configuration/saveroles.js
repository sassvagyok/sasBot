import { PermissionFlagsBits, ApplicationCommandOptionType, MessageFlags } from "discord.js";
import saverolesSchema from "../../../models/saveroleModel.js";

export default {
    name: "saveroles",
    description: "Tagok rangjainak megjegyzése",
    info: "Tagok rangjainak megjegyzése kilépéskor, amiket visszalépéskor visszakapnak.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "bekapcsolás",
            description: "Tagok rangjának megjegyzésének be-/kikapcsolása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "állapot",
                    description: "Be legyen kapcsolva a rangok megjegyzése?",
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                }
            ]
        },
        {
            name: "állapot",
            description: "Jelenlegi beállítás megnézése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const saveroleData = await saverolesSchema.findOne({ Guild: interaction.guild.id });
        const subCommand = interaction.options.getSubcommand();
        const enable = interaction.options.getBoolean("állapot");

        if (subCommand === "bekapcsolás") {
            if (enable) {
                if (!saveroleData) {
                    const newData = new saverolesSchema({
                        Guild: interaction.guild.id
                    });
                    await newData.save();
        
                    interaction.reply({ content: "Rangok megjegyzése bekapcsolva" });
                } else {
                    interaction.reply({ content: "A rangok megjegyzése már be van kapcsolva!", flags: MessageFlags.Ephemeral });
                }
            } else {
                if (!saveroleData) {
                    interaction.reply({ content: "A rangok megjegyzése már ki van kapcsolva!", flags: MessageFlags.Ephemeral });
                } else {
                    await saverolesSchema.findOneAndDelete({ Guild: interaction.guild.id });
                    interaction.reply({ content: "Rangok megjegyzése kikapcsolva" });
                }
            }
        }

        if (subCommand === "állapot") {
            interaction.reply({ content: saveroleData ? "A rangok megjegyzése be van kapcsolva" : "A rangok megjegyzése nincs bekapcsolva" });
        }
    }
}