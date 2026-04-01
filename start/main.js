import client from "../index.js";

if (process.env.mainToken) {
    client.login(process.env.mainToken);
} else {
    console.log("Nincs mainToken hozzáadva!");
}