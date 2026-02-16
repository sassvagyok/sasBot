import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { registerFont, createCanvas }  from "canvas";

export default {
    name: "randomszám",
    description: "Véletlenszerű szám választása",
    info: "Intervallum megadása után véletlenszerű szám választása az értékek között.",
    options: [
        {
            name: "szám1",
            description: "Első szám (egész)",
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "szám2",
            description: "Második szám (egész)",
            type: ApplicationCommandOptionType.Number,
            required: true
        }
    ],
    run: async (client, interaction) => {

        const firstNum = interaction.options.getNumber("szám1");
        const secondNum = interaction.options.getNumber("szám2");

        function getRandomColor() {
            return "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
        }

        const randomSzam = Math.floor(Math.random() * (secondNum - firstNum + 1) + firstNum);

        registerFont("data/Alexandria-Bold.ttf", { family: "Alexandria" });

        const tempCanvas = createCanvas(1, 1);
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.font = "48px Alexandria";
        tempCtx.lineWidth = 4;
        tempCtx.strokeText(randomSzam.toString(), tempCanvas.width / 2, tempCanvas.height / 2);
        const textMetrics = tempCtx.measureText(randomSzam.toString());
        const textWidth = textMetrics.width;

        const canvas = createCanvas(Math.ceil(textWidth + 40), 70);
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, getRandomColor());
        gradient.addColorStop(1, getRandomColor());
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "48px Alexandria";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.strokeText(randomSzam.toString(), canvas.width / 2, canvas.height / 2);
        ctx.fillText(randomSzam.toString(), canvas.width / 2, canvas.height / 2);

        const buffer = canvas.toBuffer("image/png");

        if (interaction.channel.type !== 1 && !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.AttachFiles)) return interaction.reply({ content: `${randomSzam}` }); 

        interaction.reply({ files: [{ attachment: buffer, name: `${randomSzam}.png` }] });
    }
}