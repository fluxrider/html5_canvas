/*
 * Written by David Lareau on April 10, 2011.
 * 
 * Polled Input wrapper
 */
 
 var LEFT = 37;
 var UP = 38;
 var RIGHT = 39;
 var DOWN = 40;
 var ENTER = 13;
 var SPACE = 32;
 var ESCAPE = 27;
 
 var VK_TOUCH = 1024; // low-level touch states, use POINTER instead in your app
 var VK_MOUSE = 1025; // low-level mouse states, use POINTER instead in your app (on my tablet, the mouse events are simulated poorly)

 var POINTER = 1026; // aggregate of mouse and touch data
 
 function PolledInput() {

	// Attributes/Construct
	this.keyboard_pressed = new Array();
	this.keyboard_changed = new Array();
	this.keyboard_lost = new Array();

	this.focusedVar = true; // BUG: not exact, maybe the component is not focused on start
	this.destroyedVar = false;

	this._mouseX = 0;
	this._mouseY = 0;
	this._touchX = 0;
	this._touchY = 0;
	this.pointerX = 0;
	this.pointerY = 0;

	this.favourTouchInformation = false;

	// Methods
	this.typed = function(key) {
		return (!this.held(key) && this.changed(key)) || this.lost(key);
	}

	this.held = function(key) {
		return this.keyboard_pressed[key] != undefined && this.keyboard_pressed[key] != 0;
	}

	this.changed = function(key) {
		return this.keyboard_changed[key] != undefined && this.keyboard_changed[key] != 0;
	}

	this.lost = function(key) {
		return this.keyboard_lost[key] != undefined && this.keyboard_lost[key] != 0;
	}

	this.polled = function() {
		this.keyboard_changed.length = 0;
		this.keyboard_lost.length = 0;
	}

	this.clearKeys = function() {
		this.keyboard_pressed.length = 0;
		this.keyboard_changed.length = 0;
		this.keyboard_lost.length = 0;
	}

	this.focused = function() {
		return this.focusedVar;
	}

	this.destroyed = function() {
		return this.destroyedVar;
	}

	// Private Methods
	this.value = function(v) {
		return v ? 1 : 0;
	}

	this.setKey = function(key, state) {
		// update POINTER if TOUCH or MOUSE are updated
		if(key == VK_TOUCH) {
			// trust touch information more than mouse, for POINTER data
			this.favourTouchInformation = true;
			this.setKey(POINTER, state);
			this.pointerX = this._touchX;
			this.pointerY = this._touchY;
		}
		if(key == VK_MOUSE && !this.favourTouchInformation) {
			this.setKey(POINTER, state);
			this.pointerX = this._mouseX;
			this.pointerY = this._mouseY;
		}
		this.keyboard_lost[key] = this.value(this.held(key) && !state && this.changed(key));
		this.keyboard_changed[key] = this.value(this.held(key) != state);
		this.keyboard_pressed[key] = this.value(state);
	}

	// KeyListener
	this.keyPressed = function(e) {
		this.setKey(e.keyCode, true);
	}

	this.keyReleased = function(e) {
		this.setKey(e.keyCode, false);
	}

	// WindowListener
	this.windowDestroyNotify = function(e) {
		destroyedVar = true;
	}

	this.windowGainedFocus = function(e) {
		clearKeys();
		focusedVar = true;
	}

	this.windowLostFocus = function(e) {
		clearKeys();
		focusedVar = false;
	}

}
