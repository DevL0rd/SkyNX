//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
var fs = require('fs');
var getDirName = require('path').dirname;

function load(path) {
	var contents = fs.readFileSync(path).toString('utf-8');
	return JSON.parse(contents)
}
function save(path, obj) {
	var contents = JSON.stringify(obj, null, "\t")
	fs.mkdir(getDirName(path), { recursive: true }, function (err) {
		if (err) throw err;
		fs.writeFile(path, contents, function (err) {
			if (err) throw err;
		});
	});
}
exports.load = load;
exports.save = save;