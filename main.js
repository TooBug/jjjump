var electron = require('electron');

var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

app.on('window-all-closed', function() {
	app.quit();
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({
		width: 600,
		height: 800,
		'use-content-size':true,
		resizable:true
	});
	let htmlUrl = 'file://' + __dirname + '/main.html';
	mainWindow.loadURL(htmlUrl);
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	mainWindow.openDevTools();
});
