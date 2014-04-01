var ckan = require('node-ckan');
var async = require('async');
var servers = require('./servers.json');

ckan.setServer('http://ckan.casil.ucdavis.edu')
ckan.setKeyFile('/etc/node-ckan/ckan-casil.json');

//local
//ckan.setServer('http://192.168.1.128:5000')
//ckan.setKey('66f67802-f4b4-4f07-979b-9a22e2e193ae');


var org = {
	display_name: "ESRI ArcGIS Servers",
	description: "ESRI ArcGIS Server harvest sources",
	image_display_url: "http://webapps-cdn.esri.com/Apps/MegaMenu/img/logo.jpg",
	title: "ESRI ArcGIS Servers",
	is_organization: true,
	image_url: "http://webapps-cdn.esri.com/Apps/MegaMenu/img/logo.jpg",
	type: "organization",
	name: "esri-arcgis-harvest-sources"
}

function run() {
	orgExists(function(exists, id){
		if( !exists ) {
			addOrg();
		} else {
			org.id = id;
			addServers();
		}
	});
}

function addOrg() {
	ckan.exec('organization_create', org, function(err, resp){
		if( err ) {
			return console.log(err);
		} else {
			org.id = resp.result.id;
			addServers();
		}
	});
}

function orgExists(callback) {
	ckan.exec('organization_show',{id:org.name}, function(err, resp){
		if( err ) return callback(false);
		callback(true, resp.result.id);
	});
}

function addServers() {
	async.eachSeries(servers,
		function(item, next){
			addServer(item, next);
		},
		function(err) {
			if( err ) console.log(err);
			console.log('done.');
		}
	);
}

function addServer(server, next) {
	var pkg = {
		name: server.replace(/.*:\/\//, '').split('/')[0].replace(/\./g,'-').toLowerCase()+
				'-'+(new Date().getTime()),
		title: server.replace(/.*:\/\//, '').split('/')[0],
		url: server,
		notes: "ESRI ArcGIS Harvest Source",
		private: false,
		source_type: "esri",
		frequency: "WEEKLY",
		state: "active",
		type: "harvest",
		owner_org: org.id
	}
	
	//debug
	//console.log(pkg);
	//next();

	ckan.exec('package_create', pkg, function(err, resp){
		if( err ) console.log(err);
		else console.log('Created: '+server);
		console.log('');
		
		next();	
	});
}

run();
