var fs = await import("node:fs");
var path = await import("node:path");
var dir = "C:\\zhongkao-ai\\src";
function w(r, c) { var f = path.join(dir, r); var d = path.dirname(f); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(f, c, "utf8"); console.log("  " + r); }
var hex = "002f002f00200073006b0069006c006c0045006e00670069006e0065002e0074007300200070006c0061006300650068006f006c006400650072000a006500780070006f0072007400200063006c00610073007300200053006b0069006c006c0045006e00670069006e00650020007b007d000a006500780070006f0072007400200063006f006e0073007400200073006b0069006c006c0045006e00670069006e00650020003d0020006e0065007700200053006b0069006c006c0045006e00670069006e006500280029003b000a";
var str = "";
for (var i = 0; i < hex.length; i += 4) {
  str += String.fromCharCode(parseInt(hex.substring(i, i+4), 16));
}
w("lib/skills/skillEngine.ts", str);
console.log("Done");
