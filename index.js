const fs = require("fs");
const request = require("request");
const jsonfile = require('jsonfile')

// Cheerio's cool
const cheerio = require('cheerio');

let imtIndex = 0;
let zones = [];

// Handler for seasonal jobs
let toBoolean = {
	'OUI' : true,
	'NON' : false
}

let procs = {}

process.argv.forEach(function (val, index, array) {
	if (index >= 2 && val.indexOf(':') !== -1) {
		argument = val.split(':')
		procs[argument[0]] = argument[1]
		if (argument[0] === 'verbose')
			console.log('\nscript launched in Verbose mode !\n')
	}
});

// destination repo and file format
// ie. results/12435:75.json

// Handle at your own convenience
function writeFileInSync(data, dest) {

	jsonfile.writeFileSync(dest, data)

	if (procs['verbose'])
		console.log("DATA : ", data)
	return ;

}

// returns endpoint by code and zone
function createUrlRequest(code, zone) {
	return ("http://candidat.pole-emploi.fr/marche-du-travail/statistiques?codeMetier=" + code + "&codeZoneGeographique=" + zone + "&typeZoneGeographique=DEPARTEMENT")
}


// builds zones array
function buildDPTS(params) {

	let count = 1

	const dptsHasard = ["2A", "2B", "974", "975"]

	while (count <= 95) {
		if (count < 10)
			zones.push("0" + count.toString())
		else if (count === 20); // Corsica needs to be treated differently
		else {
			zones.push(count.toString())
		}
		count++
	}
	zones = zones.concat(dptsHasard)

}

// gets market info by OGR code and geographical zone
function getInfoByZoneAndCode(code, zone, cb) {

	request.get(createUrlRequest(code,zone),
		function (a, b, c) {
				if (a && a.code == 'ETIMEDOUT') {
					console.log("retry code " + code);
					setTimeout( function () {
						getInfoByZoneAndCode(code, zone, cb);
					}, 2000);
					return
				}

			var $ = cheerio.load(c);

			var euros = $('.euro').text().split("€");

			var parser = {};

			if (euros.length > 1) {
				var moinsDe35 = new Array(euros[0].trim().split(" ")[1],euros[1].trim().split(" ")[1]);
				var plusDe35 = new Array(euros[2].trim().split(" ")[1], euros[3].trim().split(" ")[1]);

				// checks if Integer or Empty
				if (moinsDe35.indexOf("**") == -1) {
					moinsDe35[0] = parseInt(moinsDe35[0]);
					moinsDe35[1] = parseInt(moinsDe35[1]);
				}
				if (plusDe35.indexOf("**") == -1) {
					plusDe35[0] = parseInt(plusDe35[0]);
					plusDe35[1] = parseInt(plusDe35[1]);
				}

				parser.moinsDe35 = moinsDe35;
				parser.plusDe35 = plusDe35;

			}

			var countList = $('.list--decoration').find('li').find('strong').length;

			$('.list--decoration').find('li').find('strong').each( function (i, elem) {
				if (elem.children[0].data) {
					elem.children[0].data = elem.children[0].data.trim();

					if (elem.prev.data.indexOf("Contrat le plus employé :") !== -1) {} // data already collected
					else if (i == 0) {
						parser.lastWeek = new Array();
						parser.lastWeek.push(parseInt(elem.children[0].data.trim().split(" ")[0]));
					}
					else if (i == 1) {
						parser.lastWeek.push(parseInt(elem.children[0].data.trim().split(" ")[0]));
					}
					else if (countList == 7) { // last year data exist

						if (i == 2) {
							parser.lastYear = new Array();
							parser.lastYear.push(parseInt(elem.children[0].data.trim().split(" ")[0]));
						}
						else if (i == 3) {
							parser.lastYear.push(parseInt(elem.children[0].data.trim().split(" ")[0]));
						}
						else if (i == 4)
							parser.saison = toBoolean[elem.children[0].data.trim()];
						else if (i == 5) {
							parser.months = new Array();
							var lines = elem.children[0].data.split(",");
							for (var i = 0; i < lines.length; i++)
								parser.months.push(lines[i].trim());
						}
					}
					else if (countList == 5) { // no data over next year

						if (i == 2)
							parser.saison = toBoolean[elem.children[0].data.trim()];
						else if (i == 3) {
							parser.months = new Array();
							var lines = elem.children[0].data.split(",");
							for (var i = 0; i < lines.length; i++)
								parser.months.push(lines[i].trim());
						}
					}
					else {
						console.log("Parsing error for code " + code + " and zone " + zone);
					}
				}
			});

			var charts = new Array();
			$('#pieChart1').children('ul').children('li').each( function (i, elem) {
				var cur = elem.children[0].data.split('-');
				charts.push(cur[1].trim() + ':' + cur[0].substr(0, cur[0].length - 2));
			});

			var families = new Array();
			$('#champSelectFamilleProfessionnelle').find('option').each( function (i, elem) {
				if (elem.children[0] && elem.children[0].data)
					families.push(elem.children[0].data.trim());
			});

			var podium = new Array();
			$('#podium').find('li').children('div').each( function (i, elem) {
				var flag = 0;
				if ($(this).find('strong').text().length == 1) {
					podium.push($(this).find('strong').text());
					flag = 1;
				}
				if (flag == 1)
					podium.push(($(this).find('p').text()));
			});

			if (podium.length > 1 && podium[0] == "2" && podium[2] == "1") {
				podium[0] = "1";
				podium[2] = "2";
				var keeper = podium[1];
				podium[1] = podium[3];
				podium[3] = keeper;
			}
			if (podium.length) {
				for (var i = podium.length - 1; i >= 0; i--) {
					if (podium[i].length == 1)
						podium.splice(i, 1);

				}
				parser.podium = podium;
			}

			parser.families = families;
			parser.charts = charts;
			parser.code = code;
			parser.zone = zone;


			// write to corresponding file
			// ie. results/12546:75.json
			// handle this at your own convenience
			writeFileInSync(parser, "dest/" + code + ':' + zone + ".json");

			return cb();
	});
}

// wraps core process
// handles OGR codes and zone codes
function getInfoWrapper(imtIndex = 0, zoneIndex = 0, cb) {

		if (!zones[zoneIndex + 1]) {
			zoneIndex = -1
			imtIndex += 1
		}
		zoneIndex += 1

		if (data[imtIndex]) {
			getInfoByZoneAndCode(data[imtIndex], zones[zoneIndex], function (err) {
				if (err)
					console.log(err);
				console.log("Next info to be crawled : ", data[imtIndex + 1], " for zone ", zoneIndex + 1);
				getInfoWrapper(imtIndex, zoneIndex, cb);
			});
		}
		else {
			return cb();
		}
}

// build zones array [01...95]
buildDPTS()

// let's get our OGR list
// refer to Pôle Emploi if u need a better understanding of their OGR taxonomy
let data = jsonfile.readFileSync('./codes.json')

// launch process
getInfoWrapper(0, 0, () => {
	console.log("DONE")
})
