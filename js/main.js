
PlayState = {};

// load game assets here
PlayState.preload = function() {

	// preload background image
	this.game.load.image( 'background', 'images/background.png' );

  // load level 1 data
  this.game.load.json( 'level:1', 'data/level01.json' );
  this.game.load.image( 'ground', 'images/ground.png' );
	this.game.load.image( 'ground', 'images/grass_8x1.png' );
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

PlayState._loadLevel = function( data ) {

	// spawn all platforms
	data.platforms.forEach( this._spawnPlatform, this );
};

// spawn platforms from data coming from the JSON file
PlayState._spawnPlatform = function( platform ) {
	this.game.add.sprite( platform.x, platform.y, platform.image );
}

// init phaser
window.onload = function () {
    let game = new Phaser.Game( 960, 600, Phaser.AUTO, 'game');
    game.state.add( 'play', PlayState );
    game.state.start( 'play' );
};