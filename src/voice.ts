import {VoiceConnection} from "discord.js";
import {randomBytes} from "crypto";
import {join} from "path";
import {createReadStream, rmSync} from "fs";
import ffmpeg from "ffmpeg";
import {spawnSync} from "child_process";

let nodespeak = require("nodespeak")

/*

	this.render = (file) => {
		require('child_process').spawn(`${__dirname}/bin/nodespeak.exe`, ['-i', this.options.text, '-v', this.options.voice, '-w', '-o', file])
		return this
	}
 */

async function _say(text: string, file = "tmp", voice = "Microsoft Hazel Desktop") {
    spawnSync("nodespeak.exe", ["-i", text, "-v", voice, "-w", "-o", join("tmp", file) + ".wav"]);
}

export async function say(vc: VoiceConnection, txt: string): Promise<void> {
    return new Promise<void>(async (res) => {

        let code = randomBytes(16).toString("hex");
        await _say(txt, code);

        let proc = spawnSync("ffmpeg", ["-i", join("tmp", code + ".wav"), join("tmp", code + ".mp3")], {
            cwd: process.cwd()
        });

        let r = createReadStream(join("tmp", code + ".mp3"));
        let p = vc.play(r);
        await new Promise<void>((res, rej) => {
            p.on("finish", () => {
                console.timeEnd("Speaking")
                res();
            })
        })
        rmSync(join("tmp", code + ".wav"));
        rmSync(join("tmp", code + ".mp3"));
        res();
    })
}
