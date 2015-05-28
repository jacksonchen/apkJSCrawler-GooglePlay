var chai = require('chai'),
    assert = chai.assert,
    cheerio = require('cheerio'),
    exec = require('child_process').exec,
    download = require('../lib/download'),
    directoryMatch = new RegExp(/(\/[^\/]+)+/),
    filePath = __dirname + "/apks",
    packageName = "com.evernote";

chai.Should();

describe('Download HTML and APK', function () {

  before(function(done) {
    makenewCOMMAND = "mkdir -p " + filePath;
    exec(makenewCOMMAND, function(error, stdout, stderr) {
      if (stderr) return console.log(stderr);
    });
    done();
  });

  it('downloads the HTML page for ', function (done) {
    this.timeout(20000);
    download.getHTML(packageName, filePath, function(htmlPath, body) {
      $ = cheerio.load(body);
      $('div.document-title').should.exist;
      done();
    });
  });

  it('checks if HTML directory path is valid', function (done) {
    this.timeout(20000);
    download.getHTML(packageName, filePath, function(htmlPath) {
      htmlPath.should.match(directoryMatch);
      done();
    });
  });

  after(function(done) {
    deleteCOMMAND = "rm -rf " + filePath;
    exec(deleteCOMMAND, function(error, stdout, stderr) {
      if (stderr) return console.log(stderr);
      done();
    });
  });

})
