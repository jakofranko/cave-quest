// From http://www.codingcookies.com/2013/04/20/building-a-roguelike-in-javascript-part-4/
Game.Mixins = {};

Game.Mixins.Moveable = {
	name: 'Moveable',
	tryMove: function(x, y, z, map) {
		// Must use starting z
		var tile = map.getTile(x, y, this.getZ());
		var target = map.getEntityAt(x, y, this.getZ());
		// If our z level changed, check if we are on stair
		if(z < this.getZ()) {
			if(tile != Game.Tile.stairsUpTile) {
				Game.sendMessage(this, "You can't go up here!");
			} else {
				Game.sendMessage(this, "You ascend to level %s!", [z + 1]);
				this.setPosition(x, y, z);
			}
		} else if(z > this.getZ()) {
			if(tile != Game.Tile.stairsDownTile) {
				Game.sendMessage(this, "You can't go down here!");
			} else {
				Game.sendMessage(this, "You descend to level %s!", [z + 1]);
				this.setPosition(x, y, z);
			}
		} else if(target) {
			if(this.hasMixin('Attacker')) {
				this.attack(target);
				return true;
			} else {
				return false;	
			}
		} else if(tile.isWalkable()) {
			this.setPosition(x, y, z);
			return true;
		} else if(tile.isDiggable()) {
			map.dig(x, y, z);
			return true;
		}
		return false;
	}
};

Game.Mixins.Destructible = {
	name: 'Destructible',
	init: function(template) {
		this._maxHp = template['maxHp'] || 10;
		this._hp = template['hp'] || this._maxHp;
		this._defenseValue = template['defenseValue'] || 0;
	},
	getDefenseValue: function() {
		return this._defenseValue;
	},
	getHp: function() {
		return this._hp;
	},
	getMaxHp: function() {
		return this._maxHp;
	},
	takeDamage: function(attacker, damage) {
		this._hp -= damage;
		if(this._hp <= 0) {
			Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
        	Game.sendMessage(this, 'You die!');
			this.getMap().removeEntity(this);
		}
	}
};

Game.Mixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
    	this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function() {
    	return this._attackValue;
    },
    attack: function(target) {
        // Only remove the entity if they were attackable
        if (target.hasMixin('Destructible')) {
        	var attack = this.getAttackValue();
        	var defense = target.getDefenseValue();
        	var max = Math.max(0, attack - defense);
        	var damage = 1 + Math.floor(Math.random() * max);

        	Game.sendMessage(this, 'You strike the %s for %s damage!', [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %s damage!', [this.getName(), damage]);
            target.takeDamage(this, damage);
        }
    }
};

Game.Mixins.MessageRecipient = {
	name: 'MessageRecipient',
	init: function(template) {
		this._messages = [];
	},
	receiveMessage: function(message) {
		this._messages.push(message);
	},
	getMessages: function() {
		return this._messages;
	},
	clearMessages: function() {
		this._messages = [];
	}
};

Game.sendMessage = function(recipient, message, args) {
	// Make sure the recipient can receive messages
	if(recipient.hasMixin('MessageRecipient')) {
		// If args were passed, format the message
		// Elsewise, don't format the message
		if(args) {
			message = message.format.apply(message, args);
		}
		recipient.receiveMessage(message);
	}
};
Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args) {
    // If args were passed, then we format the message, else
    // no formatting is necessary
    if(args) {
        message = message.format.apply(this, args);
    }
    // Get the nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    // Iterate through nearby entities, sending the message if
    // they can receive it.
    for(var i = 0; i < entities.length; i++) {
        if(entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
}

Game.Mixins.PlayerActor = {
	name: 'PlayerActor',
	groupName: 'Actor',
	act: function() {
		// Re-render the screen
		Game.refresh();
		// Lock the engine and wait asynchronously
        // for the player to press a key.
        this.getMap().getEngine().lock();
        this.clearMessages();
	}
};

Game.Mixins.FungusActor = {
	name: 'FungusActor',
	groupName: 'Actor',
	init: function() {
        this._growthsRemaining = 5;
    },
	act: function() {
		if(this._growthsRemaining > 0) {
			if(Math.random() <= 0.02) {
				// Generate the coordinates of a random adjacent square by
                // generating an offset between [-1, 0, 1] for both the x and
                // y directions. To do this, we generate a number from 0-2 and then
                // subtract 1.
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                // Make sure we aren't trying to spawn on the same tile as us
                if (xOffset != 0 || yOffset != 0) {
                    // Check if we can actually spawn at that location, and if so
                    // then we grow!
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset, this.getZ())) {
                        var entity = new Game.Entity(Game.FungusTemplate);
                        entity.setPosition(this.getX() + xOffset, this.getY() + yOffset, this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;

                        // Send a message nearby!
                        Game.sendMessageNearby(this.getMap(), entity.getX(), entity.getY(), entity.getZ(), 'The fungus is spreading!');
                    }
                }
			}
		}
	}
}

Game.PlayerTemplate = {
	character: '@',
	foreground: 'white',
	maxHp: 40,
	attackValue: 10,
	mixins: [
		Game.Mixins.Moveable, 
		Game.Mixins.PlayerActor, 
		Game.Mixins.Destructible, 
		Game.Mixins.Attacker, 
		Game.Mixins.MessageRecipient
	]
};

Game.FungusTemplate = {
	name: 'fungus',
	character: 'F',
	foreground: 'green',
	maxHp: 10,
	mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
};