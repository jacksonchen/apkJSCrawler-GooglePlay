var execSync = require('child_process').execSync,
    exec = require('child_process').exec,
    log4js = require('log4js'),
    logger = log4js.getLogger('GooglePlay'),
    fs = require('fs'),
    request = require('request'),
    BASE_URL = "https://play.google.com/store/apps/details?id=";

function download(packageName, outputDir, crawlerPath, callback) {
  var tempAPKPath = outputDir + "/" + packageName + ".apk";
  DOWNLOADCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf download " + packageName;
  logger.info("download::Begin Download APK " + packageName);

  exec(DOWNLOADCOMMAND, function(error, stdout, stderr) {
    if (stderr || error) {
      fs.appendFileSync(outputDir + '/failedAPK.txt', packageName + "\n");
      return logger.error("download::STDerr:" + stderr + ". Error:" + error);
    }
    logger.info("download::End Download APK " + packageName);

    MOVECOMMAND = "mv " + packageName + ".apk " + tempAPKPath;
    exec(MOVECOMMAND, function(error, stdout, stderr) {
      if (stderr || error) {
        return logger.error("download::STDerr:" + stderr + ". Error:" + error);
      }
      logger.info("download::Moved " + packageName);
      getComment(packageName, outputDir, crawlerPath, function(tempCommentPath) {
        getHTML(packageName, outputDir, function(htmlPath, body) {
          callback(tempAPKPath, htmlPath, tempCommentPath);
        });
      })
    });
  })
}

function getComment(packageName, outputDir, crawlerPath, callback) {
  COMMENTCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf reviews " + packageName;
  logger.info("download::Begin Download Comments " + packageName);
  exec(COMMENTCOMMAND, function(error, stdout, stderr) {
    if (stderr || error) {
      return logger.error("download::STDerr:" + stderr + ". Error:" + error);
    }
    logger.info("getComment::Comments for " + packageName + " have been retrieved")
    var tempCommentPath = outputDir + "/" + packageName + ".json5";
    fs.writeFile(tempCommentPath, stdout, function(err) {
      if (err) { return logger.error("getComment::" + err); }
      callback(tempCommentPath)
    })
  })
}

function getHTML(packageName, outputDir, callback) {
  var url = BASE_URL + packageName;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      logger.info("getHTML::Begin downloading HTML from " + url);
      var htmlPath = outputDir + '/' + packageName + '-GooglePlay.html';
      var err = fs.writeFileSync(htmlPath, body)
      if (err) { return logger.error("getHTML::Download HTML has an error: " + err) }
      logger.info("getHTML::HTML downloaded from " + url);
      callback(htmlPath, body);
    }
    else {
      logger.error("getHTML::" + url + " has an ERROR");
      return logger.error("getHTML::" + error);
    }
  });
}

module.exports = download;
module.exports.getHTML = getHTML;
