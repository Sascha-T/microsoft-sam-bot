let fs = require("fs");
let bibleText = fs.readFileSync("bible.txt", "UTF8").split("\r\n");
let bible = {};

for (let i in bibleText) {
    let verse = bibleText[i];
    let args = verse.split("\t")

    let name = args[0];
    let text = args[1];

    let names = name.split(" ");
    let code = names[names.length - 1];
    delete names[names.length - 1];
    let trueName = names.join(" ");
    if (trueName.endsWith(" "))
        trueName = trueName.substr(0, trueName.length - 1);


    let codes = code.split(":")
    let major = codes[0]
    let minor = codes[1]

    if (!bible[trueName])
        bible[trueName] = {};

    if(!bible[trueName][major])
        bible[trueName][major] = {};
    bible[trueName][major][minor] = text;
}

let json = JSON.stringify(bible, null, 4);
fs.writeFileSync("bible.json", json);
