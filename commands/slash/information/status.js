import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import packageJson from "../../../package.json" with { type: "json" };
import fetch from "node-fetch";
import moment from "moment";
import "moment-duration-format";

export default {
    name: "status",
    description: "Technikai információk sasBot-ról",
    info: "Aktuális verzió, válaszidő, uptime és szerverek számának kijelzése.",
    run: async (client, interaction) => {

        await interaction.deferReply();
        
        const msg = await interaction.fetchReply();
        const duration = moment.duration(client.uptime).format("M[h], D[n], H[ó], m[p], s[mp]", { trim: "all" });

        // const divergence = await fetch("http://divergence.nyarchlinux.moe/api/divergence")
        // const fetchedDivergence = await divergence.json();

        const statusContainer = new ContainerBuilder()
        .setAccentColor(0x1d88ec)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- 🛠️ Verzió: \`${packageJson.version}\`\n- 💢 Válaszidő: \`${msg.createdTimestamp - interaction.createdTimestamp}ms\`\n- ⌛ Uptime: \`${duration}\`\n- 🔌 Szerverek: \`${client.guilds.cache.size}\`\n- 🧶 Divergencia: \`1.048596\``));

        interaction.editReply({ components: [statusContainer], flags: MessageFlags.IsComponentsV2 });
    }
}