var execSync = require('child_process').execSync,
    exec = require('child_process').exec,
    fs = require('fs'),
    request = require('request'),
    BASE_URL = "https://play.google.com/store/apps/details?id=";

function download(packageName, outputDir, crawlerPath, callback) {
  var tempAPKPath = outputDir + "/" + packageName + ".apk";
  DOWNLOADCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf download " + packageName;
  console.log("download::Begin Download APK " + packageName);
  try {
    var error, stderr, stdout = execSync(DOWNLOADCOMMAND)
    console.log("download::End Download APK " + packageName);
    if (stderr) {
      console.log(stderr);
    }
    MOVECOMMAND = "mv " + packageName + ".apk " + tempAPKPath;
    exec(MOVECOMMAND, function(error, stdout, stderr) {
      if (stderr) { console.log(stderr) };
      console.log("download::Moved " + packageName);
      getComment(packageName, outputDir, crawlerPath, function(tempCommentPath) {
        getHTML(packageName, outputDir, function(htmlPath, body) {
          callback(tempAPKPath, htmlPath, tempCommentPath);
        });
      })
    });
  }
  catch (ex) {
    console.log("download::" + packageName + " failed to download apks");
    return ex;
  }
}

function getComment(packageName, outputDir, crawlerPath, callback) {
  COMMENTCOMMAND = "java -jar " + crawlerPath + "/googleplaycrawler-0.3.jar -f " + crawlerPath + "/crawler.conf reviews " + packageName;
  try {
    var error, stderr, stdout = execSync(COMMENTCOMMAND)
    if (stderr) {
      console.log("getComment::" + packageName + " has a comments error: " + stderr);
    };
    var tempCommentPath = outputDir + "/" + packageName + ".json5";
    fs.writeFile(tempCommentPath, stdout, function(err) {
      if (err) { console.log(err); }
      callback(tempCommentPath)
    })
  }
  catch (ex) {
    console.log("getComment::" + packageName + " failed to download comments");
    return ex
  }
}

function getHTML(packageName, outputDir, callback) {
  var url = BASE_URL + packageName;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("getHTML::Begin downloading HTML from " + url);
      var htmlPath = outputDir + '/' + packageName + '-GooglePlay.html';
      // request(url).pipe(fs.createWriteStream(htmlPath));
      var err = fs.writeFileSync(htmlPath, body)
      if (err) { console.log("getHTML::Download HTML has an error: " + err) }
      console.log("getHTML::HTML downloaded from " + url);
      callback(htmlPath, body);
    }
    else {
      console.log("getHTML::" + url + " has an ERROR");
      console.log("getHTML::" + error);
    }
  });
}

module.exports = download;
module.exports.getHTML = getHTML;
