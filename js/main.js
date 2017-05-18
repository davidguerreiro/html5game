/**
 * Create hero
 */
function Hero( game, x, y ) {

	// class Phaser.Sprite constructor
	Phaser.Sprite.call( this, game, x, y, 'hero' );

}

// inherit from Phaser.Sprite
Hero.prototype             = Object.create( Phaser.Sprite.prototype );
Hero.prototype.constructor =  Hero;

PlayState = {};

// load game assets here
PlayState.preload = function() {

	// load hero image
	this.game.load.image( 'hero', 'images/hero_stopped.png' );

	// preload background image
	this.game.load.image( 'background', 'images/background.png' );

  // load level 1 data
  this.game.load.json( 'level:1', 'data/level01.json' );
  this.game.load.image( 'ground', 'images/ground.png' );
	this.game.load.image('grass:8x1', 'images/grass_8x1.png' );
	this.game.load.image('grass:6x1', 'images/grass_6x1.png');
  this.game.load.image('grass:4x1', 'images/grass_4x1.png');
  this.game.load.image('grass:2x1', 'images/grass_2x1.png');
  this.game.load.image('grass:1x1', 'images/grass_1x1.png');
};

// create game entities and set up world here
PlayState.create = function() {

	// create background image
	this.game.add.image( 0, 0, 'background' );

	// create level 1 data
	this._loadLevel( this.game.cache.getJSON( 'level:1' ) );
}

/**
 * Check the methods defined below load level as load level
 * loginc has been splited
 */
PlayState._loadLevel = function( data ) {

	// spawn all platforms
	data.platforms.forEach( this._spawnPlatform, this );

	// spawn hero and enemies
	this._spawnCharacters( { hero: data.hero } );
};

// spawn platforms from data coming from the JSON file
PlayState._spawnPlatform = function( platform ) {
	this.game.add.sprite( platform.x, platform.y, platform.image );
}

// spawn hero and enemies data coming from the JSON file
PlayState._spawnCharacters = function( data ) {

	// spawn hero
	this.hero = new Hero( this.game, data.hero.x, data.hero.y );
	this.game.add.existing( this.hero );
};

// init phaser
window.onload = function () {
    let game = new Phaser.Game( 960, 600, Phaser.AUTO, 'game');
    game.state.add( 'play', PlayState );
    game.state.start( 'play' );
};