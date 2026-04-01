import client from "../index.js";

if (process.env.testToken) {
    client.login(process.env.testToken);
} else {
    console.log("Nincs testToken hozzáadva!");
}