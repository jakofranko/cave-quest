// From http://www.codingcookies.com/2013/04/05/building-a-roguelike-in-javascript-part-3a/
// Base prototype for representing characters
Game.Glyph = function(properties) {
	// Instantiate properties to default if they weren't passed
    properties = properties || {};
    this._char = properties['character'] || ' ';
    this._foreground = properties['foreground'] || 'white';
    this._background = properties['background'] || 'black';
};

// Create standard getters for glyphs
Game.Glyph.prototype.getChar = function(){ 
    return this._char; 
}
Game.Glyph.prototype.getBackground = function(){
    return this._background;
}
Game.Glyph.prototype.getForeground = function(){ 
    return this._foreground; 
}