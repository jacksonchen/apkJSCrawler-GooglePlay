var exec = require('exec-queue'),
    _ = require('lodash'),
    config = require('config'),
    download = require('./download.js'),
    re = new RegExp("[^;]+;([^;]+);");

function init(keyword, outputDir, callback) {
  counter = 0
  var crawlerPath = config.get('plugin.GooglePlayCrawlerPath');
  COMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf search " + keyword;
  exec(COMMAND, function(error, stdout, stderr) {
    if (stderr) return console.log(stderr);
    var output = stdout.split(/\n/);
    output = _.rest(output);
    output = _.compact(output);
    console.log("~~~~~~~~~~~~~~" + output.length + " APKs detected for keyword [" + keyword + "]~~~~~~~~~~~~~~");
    output.forEach(function(outputLine) {
      packageName = outputLine.match(/[^;]+;([^;]+);/)[1];
      download(packageName, outputDir, crawlerPath, counter, function(tempAPKPath, htmlPath, tempCommentPath) {
        counter += 1
        callback(tempAPKPath, htmlPath, tempCommentPath);
      })
    });
  });
}

module.exports.init = init
