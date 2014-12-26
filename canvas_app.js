// exposed globals
var defaultTextFillColor;
var defaultTextStrokeColor;
var backgroundColor;
var input;
var totalLoadTime;
var canvas;

// hidden globals
var canvas_app_t0;
var canvas_app_appt0;
var canvas_app_currentWindowInnerWidth;
var canvas_app_currentWindowInnerHeight;
var canvas_app_canvasScale;
var canvas_app_images;
var canvas_app_sounds;
var canvas_app_allLoaded;
var canvas_app_caughtException;

// utils: time
function currentTimeMillis() {
	var now = new Date();
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
}

// utils: text
function drawOutlineText(g, message, x, y, fillColor, strokeColor) {
	if(!fillColor && !strokeColor) {
		fillColor = defaultTextFillColor;
		strokeColor = defaultTextStrokeColor;
	}
	var storedBaseline = g.textBaseline;
	g.textBaseline = "hanging";
	var offsetY = 2;
	if(fillColor) {
		var storedFillStyle = g.fillStyle;
		g.fillStyle = fillColor;
		g.fillText(message, x, y + offsetY);
		g.fillStyle = storedFillStyle;
	}
	if(strokeColor) {
		var storedStrokeStyle = g.strokeStyle;
		g.strokeStyle = strokeColor;
		g.strokeText(message, x, y + offsetY);
		g.strokeStyle = storedStrokeStyle;
	}
	g.textBaseline = storedBaseline;
}

function drawOutlineTextBootstrap(message, x, y, fillColor, strokeColor) {
	drawOutlineText(this, message, x, y, fillColor, strokeColor);
}

function setFont(fontSize, fontName) {
	this.font = fontSize + "px " + fontName;
	this.fontLineHeight = fontSize;
}

// util: clear screen
function clearScreen(g) {
	var storedFillStyle = g.fillStyle;
	g.fillStyle = backgroundColor;
	g.fillRect(0, 0, canvas.width, canvas.height);
	g.fillStyle = storedFillStyle;
}

// util: scale canvas to fit window
function scaleCanvas() {
	var border = 1; // assumes the canvas has a 1px border
	var W = window.innerWidth;
	var H = window.innerHeight;
	// don't update canvas size if we didn't change window size
	if(W == canvas_app_currentWindowInnerWidth || H == canvas_app_currentWindowInnerHeight) return;
	canvas_app_currentWindowInnerWidth = W;
	canvas_app_currentWindowInnerHeight = H;
	// calculate new size
	var width = W - border - border;
	var height = H - border - border;
	var ratio = canvas.width / canvas.height;
	if(width < height) {
		height = width / ratio;
	} else {
		width = height * ratio;
	}
	// scale canvas
	canvas.style.width = width+'px';
	canvas.style.height = height+'px';
	canvasScale = width / canvas.width;

	// use nearest neighbor if scaling up
	// canvas.style.imageRendering = "pixelated"; // doesn't seem to work, it's too recent and the feature is in limbo http://stackoverflow.com/questions/7615009/disable-interpolation-when-scaling-a-canvas
	//	"image-rendering: pixelated;";
	// test: http://jsfiddle.net/namuol/VAXrL/1459/
	
	// reposition canvas
	var div = document.getElementById("appCanvasDiv");
	div.style.left = (W - (width + border + border)) / 2 + "px";
	div.style.top = (H - (height + border + border)) / 2 + "px";
}

// input
function keyPressed(e) { input.keyPressed(e);	} // note: we can't pass input.keyPressed directly to document.onkeydown
function keyReleased(e) { input.keyReleased(e);	} // note: we can't pass input.keyReleased directly to document.onkeyup
function touchStart(e) {
	var rect = canvas.getBoundingClientRect();
	for(var  i = 0; i < e.changedTouches.length; i++) {
		var touch = e.changedTouches[i];
		input._touchX = Math.round((touch.clientX - rect.left) / canvas_app_canvasScale);
		input._touchY = Math.round((touch.clientY - rect.top) / canvas_app_canvasScale);
		input.setKey(VK_TOUCH, true);
	}
}
function touchEnd(e) { 
	var rect = canvas.getBoundingClientRect();
	for(var  i = 0; i < e.changedTouches.length; i++) {
		var touch = e.changedTouches[i];
		input._touchX = Math.round((touch.clientX - rect.left) / canvas_app_canvasScale);
		input._touchY = Math.round((touch.clientY - rect.top) / canvas_app_canvasScale);
		input.setKey(VK_TOUCH, false);
	}
}
function mouseDown(e) {
	var rect = canvas.getBoundingClientRect();
	input._mouseX = Math.round((e.clientX - rect.left) / canvas_app_canvasScale);
	input._mouseY = Math.round((e.clientY - rect.top) / canvas_app_canvasScale);
	input.setKey(VK_MOUSE, true);
}
function mouseUp(e) {
	var rect = canvas.getBoundingClientRect();
	input._mouseX = Math.round((e.clientX - rect.left) / canvas_app_canvasScale);
	input._mouseY = Math.round((e.clientY - rect.top) / canvas_app_canvasScale);
	input.setKey(VK_MOUSE, false);
}

// util: loading screen
function loadImage(filename) {
	var image = document.createElement('img');
	image.src = filename;
	canvas_app_images[filename] = image;
	return image;
}

function getImage(filename) {
	if(!canvas_app_images[filename]) throw "Image " + filename + " hasn't been loaded";
	return canvas_app_images[filename];
}

function loadSound(filename) {
	var sound = new Audio(filename);
	canvas_app_sounds[filename] = sound;
	return sound;
}

function getSound(filename) {
	if(!canvas_app_sounds[filename]) throw "Sound " + filename + " hasn't been loaded";
	return canvas_app_sounds[filename];
}


function loadingTick(g, time) {
	g.drawText("Loading..." + time, 0, 0);
	canvas_app_allLoaded = true;
	var textHeight = 30;
	var y = textHeight;
	for (filename in canvas_app_images) {
		if(!canvas_app_images[filename].complete) {
			canvas_app_allLoaded = false;
			g.drawText(filename, 0, y);
			y += 30;
		}
	}
	// Note: we don't bother with waiting for sound, rumours are there is no preload happening, and the 'canplaythrough' event is fake.
}

// main init
function beginMainLoop() {
	canvas_app_t0 = currentTimeMillis();
	canvas = document.getElementById("appCanvas");
	backgroundColor = "white";
	canvas_app_currentWindowInnerWidth = -1;
	canvas_app_currentWindowInnerHeight = -1;
	canvas_app_canvasScale = 1;
	defaultTextFillColor = "white"
	defaultTextStrokeColor = "black";
	canvas_app_images = new Array();
	canvas_app_sounds = new Array();
	canvas_app_allLoaded = false;

	// input
	input = new PolledInput();
	document.onkeydown = keyPressed;
	document.onkeyup = keyReleased;
	canvas.addEventListener('touchstart', touchStart, false);
	canvas.addEventListener('touchend', touchEnd, false);
	canvas.addEventListener('mousedown', mouseDown, false);
	canvas.addEventListener('mouseup', mouseUp, false);

	// main loop
	try {
		appInit();
		mainLoop();	
	} catch(e) {
		var g = canvas.getContext("2d");
		clearScreen(g);
		g.setFont(30, "Arial");
		g.fillText("Error: " + e, 10, 50);
	}
}

// main loop
function mainLoop() {
	scaleCanvas();
	var g = canvas.getContext("2d");
	var time = currentTimeMillis();
	g.drawText = drawOutlineTextBootstrap;
	g.setFont = setFont;
	g.setFont(30, "Arial");
	clearScreen(g);
	// tick
	try {
		if(canvas_app_caughtException) throw canvas_app_caughtException;
		if(canvas_app_allLoaded) {
			appTick(g, time - canvas_app_appt0);
		} else {
			loadingTick(g, time - canvas_app_t0);
			canvas_app_appt0 = currentTimeMillis();
			totalLoadTime = canvas_app_appt0 - canvas_app_t0;
		}
	} catch(e) {
		canvas_app_caughtException = e;
		clearScreen(g);
		g.setFont(12, "Arial");
		g.fillText("Error: " + e, 10, 50);
	}
	input.polled();
	// repaint (roughly at a given frequency)
	setTimeout(function(){ mainLoop(); }, 1000 / 30);
}
