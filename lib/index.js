var exec = require('exec-queue'),
    _ = require('lodash'),
    log4js = require('log4js'),
    logger = log4js.getLogger('GooglePlay'),
    config = require('config'),
    download = require('./download.js'),
    re = new RegExp("[^;]+;([^;]+);");

function init(keyword, outputDir, callback) {
  var crawlerPath = config.get('plugin.GooglePlayCrawlerPath');
  COMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf search " + keyword;
  exec(COMMAND, function(error, stdout, stderr) {
    if (stderr) return logger.error("init::" + stderr);
    var output = stdout.split(/\n/);
    output = _.rest(output);
    output = _.compact(output);
    logger.info("init::" + output.length + " APKs detected for keyword [" + keyword + "]");
    output.forEach(function(outputLine) {
      packageName = outputLine.match(/[^;]+;([^;]+);/)[1];
      download(packageName, outputDir, crawlerPath, function(tempAPKPath, htmlPath, tempCommentPath) {
        callback(tempAPKPath, htmlPath, tempCommentPath);
      })
    });
  });
}

module.exports.init = init
