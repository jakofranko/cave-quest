var Game = {
	map: {},
	scheduler: new ROT.Scheduler.Simple(),
	engine: new ROT.Engine(this.scheduler),

	layout: null,
	buildings: null,
	player: null,

	_display: null,
	_currentScreen: null,
	_screenWidth: 80,
	_screenHeight: 24,

	getDisplay: function() {
		return this._display;
	},
	getScreenWidth: function() {
	    return this._screenWidth;
	},
	getScreenHeight: function() {
	    return this._screenHeight;
	},
	handleEvent: function(e) {
		switch (e.type) {
			case "load":
				window.removeEventListener("load", this);
				this._load();
			break;

			case "resize":
				this._resize();
			break;
		}
	},
	init: function() {
		window.addEventListener("load", this);
		window.addEventListener("resize", this);

		// TODO: Make width and height constants accessible throughout the game
	    this._display = new ROT.Display({width: this._screenWidth, height: this._screenHeight});
	    // Create a helper function for binding to an event
	    // and making it send it to the screen
	    var game = this; // So that we don't lose this
	    var bindEventToScreen = function(event) {
	        window.addEventListener(event, function(e) {
	            // When an event is received, send it to the
	            // screen if there is one
	            if (game._currentScreen !== null) {
	                // Send the event type and data to the screen
	                game._currentScreen.handleInput(event, e);
	                // Clear the screen
                    game._display.clear();
                    // Render the screen
                    game._currentScreen.render(game._display);
	            }
	        });
	    }
	    // Bind keyboard input events
	    bindEventToScreen('keydown');
	    // bindEventToScreen('keyup');
	    // bindEventToScreen('keypress');
	},
	switchScreen: function(screen) {
	    // If we had a screen before, notify it that we exited
	    if (this._currentScreen !== null) {
	        this._currentScreen.exit();
	    }
	    // Clear the display
	    this.getDisplay().clear();
	    // Update our current screen, notify it we entered
	    // and then render it
	    this._currentScreen = screen;
	    if (!this._currentScreen !== null) {
	        this._currentScreen.enter();
	        this._currentScreen.render(this._display);
	    }
	},
	_load: function() {
        document.querySelector('#level').appendChild(this.getDisplay().getContainer());
        // Load the start screen
        Game.switchScreen(Game.Screen.startScreen);
        this.layout = new Game.Layout(28, 20);
        this.layout.init();
	},
	_resize: function() {
		if (!this.layout) { return; }
		var level = document.querySelector("#level");
		var overview = this.layout.getNode();
		this.layout.resize(overview.offsetWidth, overview.offsetHeight);
	}
}