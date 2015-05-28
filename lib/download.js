var exec = require('child_process').exec,
    fs = require('fs'),
    request = require('request'),
    BASE_URL = "https://play.google.com/store/apps/details?id=";

function download(packageName, outputDir, crawlerPath, callback) {
  var tempAPKPath = outputDir + "/" + packageName + ".apk";
  DOWNLOADCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf download " + packageName;
  exec(DOWNLOADCOMMAND, function(error, stdout, stderr) {
    if (stderr) {
      console.log(packageName + " failed");
      return console.log(stderr);
    }
    else {
      console.log("Downloaded " + packageName);
      MOVECOMMAND = "mv " + packageName + ".apk " + tempAPKPath;
      exec(MOVECOMMAND, function(error, stdout, stderr) {
        if (stderr) return console.log(stderr);
        console.log("Moved " + packageName);
        getHTML(packageName, outputDir, function(htmlPath) {
          callback(tempAPKPath, htmlPath);
        })
      });
    }
  });

}

var getHTML = function(packageName, outputDir, callback) {
  var url = BASE_URL + packageName;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var htmlPath = outputDir + '/' + packageName + '.html';

      request(url).pipe(fs.createWriteStream(htmlPath));
      console.log("HTML downloaded from " + url);
      callback(htmlPath);
    }
    else {
      console.log(url + " has an ERROR");
    }
  });
}

module.exports = download;
