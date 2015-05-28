var fs = require('fs'),
    exec = require('child_process').exec,
    _ = require('lodash'),
    download = require('./download.js'),
    re = new RegExp("[^;]+;([^;]+);");

function init(keyword, outputDir, callback) {
  readSettings(function(crawlerPath) {
    COMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf search " + keyword;
    exec(COMMAND, function(error, stdout, stderr) {
      if (stderr) return console.log(stderr);
      var output = stdout.split(/\n/);
      output = _.rest(output);
      output = _.compact(output);
      console.log("~~~~~~~~~~~~~~" + output.length + " APKs detected for keyword [" + keyword + "]~~~~~~~~~~~~~~");
      output.forEach(function(outputLine) {
        packageName = outputLine.match(/[^;]+;([^;]+);/)[1];
        download(packageName, outputDir, crawlerPath, function(tempAPKPath, htmlPath) {
          callback(tempAPKPath, htmlPath);
        })
      });
    });

  })
}

function readSettings(callback) {
  fs.readFile(__dirname + '/../settings.json', function(err, data) {
    if (err) throw err;
    var configData = JSON.parse(data);
    callback(configData.GooglePlayCrawlerPath);
  });
}

module.exports.init = init
