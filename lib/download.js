var exec = require('child_process').exec,
    log4js = require('log4js'),
    logger = log4js.getLogger('GooglePlay'),
    fs = require('fs'),
    request = require('request'),
    BASE_URL = "https://play.google.com/store/apps/details?id=";

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'play.log' }
  ]
});

function download(packageName, outputDir, crawlerPath, callback) {
  var tempAPKPath = outputDir + "/" + packageName + ".apk";
  DOWNLOADCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf download " + packageName;
  logger.info("download::Begin Download APK " + packageName);

  var javaProcess = exec(DOWNLOADCOMMAND, function(error, stdout, stderr) {
    if (!timeout) return;
    clearTimeout(timeout);

    if (stderr || error) {
      fs.appendFileSync(outputDir + '/failedAPK.txt', packageName + "\n");
      logger.error("download::STDerr:" + stderr + ". Error:" + error);
      return callback(null, null, null);
    }

    logger.info("download::End Download APK " + packageName);

    MOVECOMMAND = "mv " + packageName + ".apk " + tempAPKPath;
    exec(MOVECOMMAND, function(error, stdout, stderr) {
      if (stderr || error) {
        logger.error("download::STDerr:" + stderr + ". Error:" + error);
        return callback(null, null, null);
      }
      logger.info("download::Moved " + packageName);
      getComment(packageName, outputDir, crawlerPath, function(tempCommentPath) {
        getHTML(packageName, outputDir, function(htmlPath, body) {
          callback(tempAPKPath, htmlPath, tempCommentPath);
        });
      })
    });
  });

  var timeout = setTimeout(function() {
    timeout = null;
    logger.error("download::Timeout Error for " + packageName);
    fs.appendFileSync(outputDir + '/failedAPK.txt', packageName + "\n");
    exec("./kill.sh", function() {
      logger.debug("download::Killed Java Process for " + packageName);
      callback(null, null, null);
    });

  }, 120000);
}

function getComment(packageName, outputDir, crawlerPath, callback) {
  COMMENTCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf reviews " + packageName;
  logger.info("getComment::Begin Download Comments " + packageName);
  exec(COMMENTCOMMAND, function(error, stdout, stderr) {
    if (stderr || error) {
      logger.error("getComment::STDerr:" + stderr + ". Error:" + error);
      return callback(null);
    }
    logger.info("getComment::Comments for " + packageName + " have been retrieved")
    var tempCommentPath = outputDir + "/" + packageName + ".json5";
    fs.writeFile(tempCommentPath, stdout, function(err) {
      if (err) {
       logger.error("getComment::" + err);
       return callback(null);
      }
      logger.info("getComment::Comments for " + packageName +" have been saved to " + tempCommentPath)
      callback(tempCommentPath)
    })
  })
}

function getHTML(packageName, outputDir, callback) {
  var url = BASE_URL + packageName;
  logger.info("getHTML::Begin downloading HTML from " + url);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      logger.info("getHTML::HTML from " + url + " has been retrieved")
      var htmlPath = outputDir + '/' + packageName + '-GooglePlay.html';
      var err = fs.writeFileSync(htmlPath, body)
      if (err) {
        logger.error("getHTML::Download HTML has an error: " + err);
        return callback(null, null);
      }
      logger.info("getHTML::HTML downloaded from " + url + " has been saved to " + htmlPath);
      callback(htmlPath, body);
    }
    else {
      logger.error("getHTML::" + url + " has an ERROR and HTML could not be retrieved");
      logger.error("getHTML::" + error);
      callback(null, null);
    }
  });
}

module.exports = download;
module.exports.getHTML = getHTML;
