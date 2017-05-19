/**
 * Create hero
 */
function Hero( game, x, y ) {

	// class Phaser.Sprite constructor
	Phaser.Sprite.call( this, game, x, y, 'hero' );
	this.anchor.set( 0.5, 0.5 );

	// enable physics for the hero
	this.game.physics.enable( this );

	// avoid hero to go out of the canvas element
	this.body.collideWorldBounds = true;

}

/**
 * Create enemy Spiders
 */
function Spider( game, x, y ) {

	//extend phase sprite constructor
  Phaser.Sprite.call( this, game, x, y, 'spider' );

  // anchor
  this.anchor.set( 0.5, 0.5 );

  // animations
  this.animations.add( 'crawl', [0, 1, 2], 8, true );
  this.animations.add( 'die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12 );
  this.animations.play( 'crawl' );

  // physic properties
  this.game.physics.enable( this );
  this.body.collideWorldBounds = true;
  this.body.velocity.x         = Spider.SPEED;
}

Spider.SPEED = 100;

// inherit from Phaser.Sprite
Spider.prototype = Object.create( Phaser.Sprite.prototype );
Spider.prototype.constructor = Spider;

// inherit from Phaser.Sprite
Hero.prototype             = Object.create( Phaser.Sprite.prototype );
Hero.prototype.constructor =  Hero;

Hero.prototype.move = function( direction ) {

	/**
	 * Direction is the key pressed. Keys must be registered
	 * Body does not work if physis are not enabled
	 */
  const SPEED = 200;
  this.body.velocity.x = direction * SPEED;

	/**
	 * Basic movement by frames
	 */
	// this.x += direction * 2.5; // 2.5 pixels each frame
	
};

/**
 * Jump hero move
 */
Hero.prototype.jump = function() {
	const JUMP_SPEED = 600;
	let canJump      = this.body.touching.down;

	if( canJump ) 
	  this.body.velocity.y = -JUMP_SPEED;

	return canJump;
};

/**
 * Spiders turaround
 */
Spider.prototype.update = function() {

	//check againsts the walls and reverse direction if neccesary
	if( this.body.touching.right || this.body.blocked.right ) 
		this.velocity.x = -Spider.SPEED;  // turn left
	else if( this.body.touching.left || this.bodd.blocked.left )
		this.velocity.x = Spider.SPEED;  // turn right

};

PlayState = {};

// playstate init
PlayState.init = function() {
  this.keys = this.game.input.keyboard.addKeys({
     left  : Phaser.KeyCode.LEFT,
     right : Phaser.KeyCode.RIGHT,
     up    : Phaser.KeyCode.UP
  });
  
  // activate sound when jumping
  
  this.keys.up.onDown.add( function() {
    let didJump = this.hero.jump();
    if( didJump )
    	this.sfx.jump.play();
  }, this ); 


  this.game.renderer.renderSession.roundPixels = true;
};

// update game state
PlayState.update = function() {
  // handle collisions
  this._handleCollisions();
	// handle key inputs
	this._handleInput();
}

// manage collisions
PlayState._handleCollisions = function() {

	// add collision between the hero and the platform
	this.game.physics.arcade.collide( this.hero, this.platforms );

	// add collisions between the spiders and the platforms
	this.game.physics.arcade.collide( this.spiders, this.platforms );

	// add overlaìng between the hero and the coins
  this.game.physics.arcade.overlap( this.hero, this.coins, this._onHeroVsCoin, null, this );

  // add collision between the spiders and the invisible walls
  this.game.physics.arcade.collide( this.spiders, this.enemyWalls );
};

// this state submethod handles the inputs
PlayState._handleInput = function() {

	/**
	 * Movement
	 */
	if( this.keys.left.isDown ) { // move hero left ( -  2.5 )
		this.hero.move( -1 );
	}
	else if ( this.keys.right.isDown ) {
		this.hero.move( 1 ); // move hero rigth ( 2.5 )
	}
	else {
		// stop -- only neccesary when moving items using physics
		this.hero.move( 0 ); // stop hero when we the key is unpressed
	}
  
  /**
   * Jump
   *
   * we do not check which key is pressed, we listen for 
   * the key to be pressed and then we tigger the hero jump method
   */
  this.keys.up.onDown.add( function() {
    this.hero.jump();
  }, this);
   
};

// load game assets here
PlayState.preload = function() {

	// load hero image
	this.game.load.image( 'hero', 'images/hero_stopped.png' );

	// preload background image
	this.game.load.image( 'background', 'images/background.png' );

  // load level 1 data
  this.game.load.json( 'level:1', 'data/level01.json' );
  this.game.load.image( 'ground', 'images/ground.png' );
	this.game.load.image( 'grass:8x1', 'images/grass_8x1.png' );
	this.game.load.image( 'grass:6x1', 'images/grass_6x1.png' );
  this.game.load.image( 'grass:4x1', 'images/grass_4x1.png' );
  this.game.load.image( 'grass:2x1', 'images/grass_2x1.png' );
  this.game.load.image( 'grass:1x1', 'images/grass_1x1.png' );
  this.game.load.image( 'invisible-wall', 'images/invisible_wall.png' );

  // audio
  this.game.load.audio( 'sfx:jump', 'audio/jump.wav' );
  this.game.load.audio( 'sfx:coin', 'audio/coin.wav' );

  // coins
  this.game.load.spritesheet( 'coin', 'images/coin_animated.png', 22, 22 );

  // spiders
  this.game.load.spritesheet( 'spider', 'images/spider.png', 42, 32 );

};

// create game entities and set up world here
PlayState.create = function() {

	// create sound entities
	this.sfx = {
		jump : this.game.add.audio( 'sfx:jump' ),
		coin : this.game.add.audio( 'sfx:coin' )
	};

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

	const GRAVITY = 1200;

	// create all the groups / layers that we need
	this.platforms  = this.game.add.group();
	this.coins      = this.game.add.group();
	this.spiders    = this.game.add.group(); 
	this.enemyWalls = this.game.add.group();

	// spawn all platforms
	data.platforms.forEach( this._spawnPlatform, this );

	// spawn hero and enemies
	this._spawnCharacters( { hero: data.hero, spiders: data.spiders } );

	// spawn important objects
  data.coins.forEach( this._spawnCoin, this );

	// enable gravity here
	this.game.physics.arcade.gravity.y = GRAVITY;

	// make enemy walls invisible
	this.enemyWalls.visible = false;
};

// spawn coins
PlayState._spawnCoin = function( coin ) {
	let sprite = this.coins.create( coin.x, coin.y, 'coin' );
	sprite.anchor.set( 0.5, 0.5 );

	// add animations to coins
	sprite.animations.add( 'rotate',  [0, 1, 2, 1], 6, true ); // 6 fps, looped
	sprite.animations.play( 'rotate' );

	// give physics to coins
	this.game.physics.enable( sprite );
	sprite.body.allowGravity = false;

};

// spawn platforms from data coming from the JSON file
PlayState._spawnPlatform = function( platform ) {
	let sprite = this.platforms.create(
		platform.x, platform.y, platform.image 
	);

  this.game.physics.enable( sprite );

  // do not allow gravity for platforms
  sprite.body.allowGravity = false;

  // make the platform innmovable so the hero cannot move them
  sprite.body.immovable = true;

  // add invisible walls so spiders do not fall out
  this._spawnEnemyWall( platform.x, platform.y, 'left' );
  this._spawnEnemyWall( platform.x + sprite.width, platform.y, 'right' );

	/**
	 * Old code before the physics were enabled
	 */
	// this.game.add.sprite( platform.x, platform.y, platform.image );
};

// spawn the enemy walls
PlayState._spawnEnemyWall = function( x, y, side ) {
	let sprite = this.enemyWalls.create( x, y, 'invisible-wall' );

	// anchor and y displacement
	sprite.anchor.set( side === 'left' ? 1 : 0, 1);

	//physics properties
	this.game.physics.enable( sprite );
	sprite.body.immovable   = true;
	sprite.body.allowGravity =  false;
};

// spawn hero and enemies data coming from the JSON file
PlayState._spawnCharacters = function( data ) {

	// spawn spiders
	data.spiders.forEach( function( spider) {
    let sprite = new Spider( this.game, spider.x, spider.y );
    this.spiders.add( sprite );
	}, this ); 

	// spawn hero
	this.hero = new Hero( this.game, data.hero.x, data.hero.y );
	this.game.add.existing( this.hero );
};

// tiggered when the hero overlaps a coin
PlayState._onHeroVsCoin = function( hero, coin ) {
	this.sfx.coin.play();
	coin.kill();
};

// init phaser
window.onload = function () {
    let game = new Phaser.Game( 960, 600, Phaser.AUTO, 'game');
    game.state.add( 'play', PlayState );
    game.state.start( 'play' );
};