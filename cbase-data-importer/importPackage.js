var http = require('http');
var fs = require('fs');

var pkgList = require('./pkgs');

var ckan = require('node-ckan');


// cleanup tags and extras
for( var i = 0; i < pkgList.length; i++ ) {
    var pkg = pkgList[i];

    // hack get quinn to quick this
    if( pkg.resources ) pkg.resources = pkg.resources[0];

    if( pkg.extras ) {
        var list = [];
        for( var j = 0; j < pkg.extras.length; j++ ) {
            for( var key in pkg.extras[j] ) {
                var val = pkg.extras[j][key];
                if( !val ) break;

                if( typeof val == 'object' ) list.push({key:key,value:JSON.stringify(val)});
                else list.push({key:key,value:val});
            }
        }
        pkg.extras = list;
    }

    // clean tag names and remove any duplicates
    if( pkg.tags ) {
      var tags = [];
      var dupList = [];
      for( var j = 0; j < pkg.tags.length; j++ ) {

        pkg.tags[j].name = pkg.tags[j].name.replace(/[^a-zA-Z0-9-_\s.]/g,'');
        if( dupList.indexOf(pkg.tags[j].name) == -1 ) {
          dupList.push(pkg.tags[j].name);
          tags.push(pkg.tags[j]);
        }
      }
      pkg.tags = tags;
    }

    // clean out any null values
    for( var key in pkg ) {
      if( pkg[key] == null ) delete pkg[key];
    }
}

// clean up resources
var list = [], c = 0;
var downloadList = [];
for( var i = 0; i < pkgList.length; i++ ) {
  var pkg = pkgList[i];
  if( !pkg.resources ) continue;

  var rList = [];
  for( var j = 0; j < pkg.resources.length; j++ ) {
    var r = pkg.resources[j];

    // make sure it has a name
    if( !r.name && r.url ) r.name = r.url;

    if( !r.url ) {
       continue;
    }

    if( r.url.match(/.*download.php.*/) && !r.url.match(/.+http.*/) && !r.url.match(/.+ftp.*/) && !r.url.match(/.*\/$/ ) ) {
      var p2 = r.url.replace(/https/,'').replace(/http/,'');

      if( list.indexOf(p2) == -1 ) {
        list.push(p2);
        rList.push(r);
        downloadList.push(r);
      } else {
        c++;
      }
    } else {
      rList.push(r);
    }

    pkg.resources = rList;
  }
}

download(0);

function download(index) {
  if( index == downloadList.length ) {
    runImport();
  } else {
    var p = downloadList[index].url.split('/');
    var fname = p[p.length-2]+"_"+p[p.length-1];
    var url = downloadList[index].url;

    // update to resource info
    delete downloadList[index].url
    downloadList[index].file = './files/'+fname;
    if( !downloadList[index].name ) downloadList[index].name = fname;

    if( !fs.existsSync('./files/'+fname) ) {
      console.log("Downloading ("+index+"/"+downloadList.length+"): "+url);

      var file = fs.createWriteStream('./files/'+fname);
      var request = http.get(url.replace(/https/,'http'), function(response) {
        try {
          response.pipe(file);
          index++;

          response.on('end',function() {
            console.log("File done.")
            download(index);
          });
          
        } catch(e) {
          console.log(e);
          fs.unlinkSync('./files/'+fname);
          console.log("Failed to download: "+fname);
          index++;
          download(index);
        }
      });
      
    } else {
      index++;
      download(index);
    }
  }
}

//console.log(pkgList[0]);

ckan.setKeyFile('/etc/node-ckan/ckan-casil.json');
function runImport() {

  ckan.import({
    // verbose output
    debug : true,

    // by default if a package or resource alread exsits, it will be ignored
    // set the update flag to force updates of packages and resources
    update: false,

    updateFiles : false,

    packageStartIndex : 0,


    // server you wish to connect to
    server : "http://ceic.casil.ucdavis.edu", 

    // list of packages you want to import.
    packages : pkgList
  });
}
