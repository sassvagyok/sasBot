import { PermissionFlagsBits, ApplicationCommandOptionType } from "discord.js";
import saverolesSchema from "../../../models/saveroleModel.js";

export default {
    name: "saveroles",
    description: "Tagok rangjainak megjegyzése",
    info: "Tagok rangjainak megjegyzése kilépéskor, amiket visszalépéskor visszakapnak.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "átállítás",
            description: "Tagok rangjának megjegyzésének állítása",
            type: ApplicationCommandOptionType.Subcommand
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

        if (subCommand === "átállítás") {
            if (!saveroleData) {
                const newData = new saverolesSchema({
                    Guild: interaction.guild.id
                });
                await newData.save();
    
                interaction.reply({ content: "Rangok megjegyzése bekapcsolva" });
            } else {
                await saverolesSchema.findOneAndDelete({ Guild: interaction.guild.id });
    
                interaction.reply({ content: "Rangok megjegyzése kikapcsolva" });
            }
        }

        if (subCommand === "állapot") {
            interaction.reply({ content: saveroleData ? "A rangok megjegyzése be van kapcsolva" : "A rangok megjegyzése nincs bekapcsolva" });
        }
    }
}