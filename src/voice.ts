import {StreamDispatcher, VoiceConnection} from "discord.js";
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

async function _say(text: string, file = "tmp", voice = "Microsoft Sam") {
    spawnSync("nodespeak.exe", ["-i", text, "-v", voice, "-w", "-o", join("tmp", file) + ".wav"]);
}

export async function say(vc: VoiceConnection, txt: string): Promise<any> {
    let code = randomBytes(16).toString("hex");
    await _say(txt, code);

    let proc = spawnSync("ffmpeg", ["-i", join("tmp", code + ".wav"), join("tmp", code + ".mp3")], {
        cwd: process.cwd()
    });

    let r = createReadStream(join("tmp", code + ".mp3"));
    let p = vc.play(r);
    p.on("finish", () => {
        rmSync(join("tmp", code + ".wav"));
        rmSync(join("tmp", code + ".mp3"));
    })
    let ret = [];
    ret[0] = p;
    ret[1] = code;
    return ret;
}
