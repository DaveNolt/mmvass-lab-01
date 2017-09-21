var path = require('path');
var readline = require('readline');
var progress = require('progress-stream');
var express = require("express");
var multer = require('multer');
var app = express();
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage }).single('userFile');

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

var str = ' \b';

var fileId = 0;
var previousID = 1;
var transferEnd = {
    hasEnded: false,
    padding: 0
};

app.post('/api/upload', function (req, res) {
    fileId++;
    var p = progress({
        length: req.headers['content-length'],
        time: 100
    });
    req.pipe(p);
    // console.log(req.headers);
    p.headers = req.headers;
    p.fileId = fileId;

    p.on('progress', function (progress) {
        yOffset = p.fileId - previousID;
        if (transferEnd.hasEnded) {
            yOffset -= transferEnd.padding;
            transferEnd.hasEnded = false;
        }
        strOut = '   id: ' + p.fileId + '; uploaded ' + (progress.transferred / 1024).toFixed(2) + ' KB, ' + progress.percentage.toFixed(2) + '% of total ' + (progress.length / 1024).toFixed(2) + ' KB';
        readline.moveCursor(process.stdout, 0, yOffset);
        readline.clearLine(process.stdout);
        process.stdout.write(strOut);
        readline.moveCursor(process.stdout, -strOut.length);
        previousID = p.fileId;
    });
    upload(p, res, function (err) {
        if (err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
        transferEnd.hasEnded = true;
        transferEnd.padding = fileId - previousID + 1;
        readline.moveCursor(process.stdout, 0, transferEnd.padding);
    });
});

app.listen(3000, function () {
    console.log("Working on port 3000");
});