var exec = require('exec-queue'),
    _ = require('lodash'),
    log4js = require('log4js'),
    logger = log4js.getLogger('GooglePlay'),
    sem = require('semaphore')(1),
    config = require('config'),
    download = require('./download.js'),
    re = new RegExp("[^;]+;([^;]+);");

function init(keyword, outputDir, callback) {
  var crawlerPath = config.get('plugin.GooglePlayCrawlerPath');
  COMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf search " + keyword;
  exec(COMMAND, function(error, stdout, stderr) {
    if (stderr || error) {
      return logger.error("init::STDerr:" + stderr + ". Error:" + error);
    }
    var output = stdout.split(/\n/);
    var packages = [];
    output = _.rest(output);
    output = _.compact(output);
    logger.debug("init::" + output.length + " APKs detected for keyword [" + keyword + "]");

    output.forEach(function(outputLine) {
      var matchArr = outputLine.match(/[^;]+;([^;]+);[^;]+;([^;]+);/);
      if (matchArr.length == 3) {
        packageName = outputLine.match(/[^;]+;([^;]+);[^;]+;([^;]+);/)[1];
        price = outputLine.match(/[^;]+;([^;]+);[^;]+;([^;]+);/)[2];
        if (price.toUpperCase() == "FREE") {
          packages.push(packageName);
        }
      }
      else {
        logger.error("init::Nonconformed app query information: " + outputLine);
      }
    })

    logger.info("init::" + output.length + " free apps for keyword [" + keyword + "]");
    packages.forEach(function(packageName) {
      sem.take(function() {
        if (packageName === packages[packages.length - 1]) {
          var last = true;
        }
        else {
          var last = false;
        }
        logger.debug("init::Begin download " + packageName)
        download(packageName, outputDir, crawlerPath, function(tempAPKPath, htmlPath, tempCommentPath) {
          logger.debug("init::Finish download " + packageName);
          sem.leave();
          callback(tempAPKPath, htmlPath, tempCommentPath, last);
        })
      });
    });
  });
}

module.exports.init = init
