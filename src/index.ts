import {Client, VoiceConnection} from "discord.js";
import {mkdirSync, readFileSync} from "fs";
import {say} from "./voice";
let client = new Client();
let token = JSON.parse(readFileSync("token.json", "utf8")).token;

let voiceChats: {[key: string]: VoiceConnection} = {};

mkdirSync("tmp")

client.on("message", async (msg) => {
    let args = msg.content.split(" ");
    let cmd = args[0];

    if(cmd.startsWith("**")) {
        cmd = cmd.substr(2);
        switch (cmd) {
            case "join": {
                let sender = msg.member;
                if(sender) {
                    let voice = sender.voice;
                    if(voice.channel) {
                        let con = await voice.channel.join();
                        voiceChats[msg.guild.id] = con;
                    } else {
                        await msg.reply("Invalid channel.");
                    }
                } else {
                    await msg.reply("Invalid user.");
                }
                break;
            }
            case "say": {
                let text = args.slice(1).join(" ");
                let con = voiceChats[msg.guild.id];
                if(con) {
                    console.log("About to say: " + text)
                    await say(con, text);
                } else {
                    await msg.reply("Run **join first.")
                }
            }
        }
    }
})

process.stdin.on("data", async (data) => {
    client.destroy()
    process.exit(0)
})
client.login(token);
