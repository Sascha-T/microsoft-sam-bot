import {Client, Guild, StreamDispatcher, VoiceChannel, VoiceConnection} from "discord.js";
import {mkdirSync, readFileSync} from "fs";
import {say as say_} from "./voice";
import path from "path";
let client = new Client();
let token = JSON.parse(readFileSync("token.json", "utf8")).token;

let voiceChats: {[key: string]: VoiceConnection} = {};
let speaking: {[key: string]: any} = {}

let bible = JSON.parse(readFileSync("bible.json", "utf8"));

try {
    mkdirSync("tmp")
} catch (e) {}

async function join(vc: VoiceChannel) {
    let con = await vc.join();
    voiceChats[vc.guild.id] = con;
}
async function leave(vc: VoiceChannel) {
    if(speaking[vc.guild.id]) {
        await stop(vc.guild);
    }
    vc.leave();
    delete voiceChats[vc.guild.id];
}
function isVc(g: Guild) {
    let a = voiceChats[g.id];
    if(a)
        return true;
    return false;
}
function isSpeaking(g: Guild) {
    let b = speaking[g.id]
    if(b)
        return true;
    return false;
}
async function say(g: Guild, txt: string) {
    let vc_ = voiceChats[g.id];
    let a = await say_(vc_, txt);
    speaking[g.id] = {
        dispatcher: a
    }
    a[0].on("finish", () => {
        delete speaking[g.id];
    })
    return a[1];
}

async function saySync(g: Guild, txt: string) {
    await new Promise<void>(async (res) => {
        let vc_ = voiceChats[g.id];
        let a = await say_(vc_, txt);
        speaking[g.id] = {
            dispatcher: a
        }
        a[0].on("finish", () => {
            delete speaking[g.id];
            res();
        })
    })
}
async function stop(guild: Guild) {
    let a = speaking[guild.id];
    let disp = <StreamDispatcher>a.dispatcher;
    disp.emit("finish");
    disp.destroy();
}

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
                        await join(voice.channel);
                    } else {
                        await msg.reply("Invalid channel.");
                    }
                } else {
                    await msg.reply("Invalid user.");
                }
                break;
            }
            case "leave": {
                let vc = voiceChats[msg.guild.id];
                if(vc) {
                    await leave(vc.channel);
                } else {
                    await msg.reply("Not in voice chat.");
                }
                break;
            }
            case "say": {
                let text = args.slice(1).join(" ");
                let con = voiceChats[msg.guild.id];
                if(con) {
                    let c = speaking[msg.guild.id];
                    if(c) {
                        await msg.reply("Already speaking do **stop first");
                        return;
                    }
                    console.log("About to say: " + text)
                    await say(msg.guild, text);
                } else {
                    await msg.reply("Run **join first.")
                }
                break;
            }
            case "stop": {
                let a = speaking[msg.guild.id];
                if(a != null) {
                    await stop(msg.guild);
                }
                break;
            }
            case "bible": {
                let subcmd = args[1];
                console.log("Bible command run.")
                switch (subcmd) {
                    case "books": {
                        console.log("Bible sub-command `book` run.")
                        let books = [];
                        for (const book in bible) {
                            books.push(book);
                        }
                        await msg.reply(`Available books: \`\`\`${JSON.stringify(books)}\`\`\``)
                        break;
                    }
                    case "verses": {
                        let books = args[2];
                        if(books) {
                            let text = "";
                            let book = bible[books];
                            for(let i in book) {
                                let highest = 0;
                                for(let a in book[i]) {
                                    let int = parseInt(a);
                                    if(int > highest) {
                                        highest = int;
                                    }
                                }
                                text += `${i}: 1-${highest.toString(10)}\n`
                            }
                            await msg.reply(`Verses: \`\`\`${text}\`\`\``)
                        } else {
                            await msg.reply(`Invalid book: \`${books}\``)
                        }
                        break;
                    }
                    case "read": {
                        let books = args[2];
                        if (isVc(msg.guild)) {
                            if (books) {
                                let book = bible[books];
                                if (book) {
                                    let verses = args[3];
                                    if (verses) {
                                        let code = verses.split(":");
                                        let verse = book[code[0]][code[1]];
                                        if (verse) {
                                                if (isSpeaking(msg.guild))
                                                    await stop(msg.guild)
                                                await say(msg.guild, `${books}: ${verses}: ${verse}`);

                                        } else {
                                            await msg.reply("Verse not specified");
                                        }
                                    } else {
                                        // let text = ""
                                        for (let a_ in book) {
                                            for (let b_ in book[a_]) {
                                                let verse = book[a_][b_];
                                                /*text +=*/
                                                await saySync(msg.guild, `${a_}+${b_}: ${verse} . .\n`);
                                            }
                                        }
                                    }
                                } else {
                                    await msg.reply("Book not found")
                                }
                            } else {
                                await msg.reply("Book not specified");
                            }
                            break;
                        } else {
                            await msg.reply("Not in VC");
                        }
                        break;
                    }
                    default: {
                        await msg.reply(`Invalid command: \`${subcmd}\``)
                        break;
                    }
                }
                break;
            }
            case "file": {
                let text = args.slice(1).join(" ");
                let con = voiceChats[msg.guild.id];
                if(con) {
                    let c = speaking[msg.guild.id];
                    if(c) {
                        await msg.reply("Already speaking do **stop first");
                        return;
                    }
                    console.log("About to say: " + text)
                    let code = await say(msg.guild, text);

                    let file = path.join("tmp", code + ".mp3");
                    await msg.reply("Here you go", {
                        files: [file]
                    });
                } else {
                    await msg.reply("Run **join first.")
                }
                break;
            }
        }
    }
})

process.stdin.on("data", async (data) => {
    client.destroy()
    process.exit(0)
})
client.login(token);
