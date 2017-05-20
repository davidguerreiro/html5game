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

	// enable animations
	this.animations.add( 'stop', [0] );
	this.animations.add( 'run', [1, 2], 8, true ); // 8 fps looped
	this.animations.add( 'jump', [3] );
	this.animations.add( 'fall', [4] );

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

/**
 * Check which animation has to be displayed
 *
 * @return {String} name
 */
Hero.prototype._getAnimationName = function() {
	let name = 'stop'; // default animation

	if ( this.body.velocity.y < 0 )
		name = 'jump'; // jumping
  else if( this.body.velocity.y >= 0 && !this.body.touching.down )
		name = 'fall'; // failing
	else if( this.body.velocity.x !== 0 && this.body.touching.down )
		name = 'run'; // running

  return name;
};

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
	
	// flip the character direction applying a negative scale to the hero image
	if( this.body.velocity.x < 0 )
		this.scale.x = -1;
	else if ( this.body.velocity.x > 0 )
    this.scale.x = 1;	
	
};

/**
 * Hero update method to check which animation should
 * we display every frame
 * 
 */
Hero.prototype.update = function() {
	// update sprite animation, if it need changing
	let animationName = this._getAnimationName();

	if( this.animations.name !== animationName )
		this.animations.play( animationName );
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
 * Add bounce method to class Hero
 */
Hero.prototype.bounce = function() {
	const BOUNCE_SPEED   = 200;
	this.body.velocity.y = -BOUNCE_SPEED;
}

/**
 * Spiders turaround
 */
Spider.prototype.update = function() {

	//check againsts the walls and reverse direction if neccesary
	if( this.body.touching.right || this.body.blocked.right ) 
		this.body.velocity.x = -Spider.SPEED;  // turn left
	else if( this.body.touching.left || this.body.blocked.left )
		this.body.velocity.x = Spider.SPEED;  // turn right

};

/**
 * Spider death
 */
Spider.prototype.die = function() {
	this.body.enable = false;

	this.animations.play( 'die').onComplete.addOnce( function() {
    this.kill();
	}, this);
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

  // coins pickup count
  this.coinPickupCount = 0;
};

// update game state
PlayState.update = function() {

  // handle collisions
  this._handleCollisions();
	// handle key inputs
	this._handleInput();
	// update coin count when the player collects a coin
	this.coinFont.text = 'x' + this.coinPickupCount;
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

  // add overlap when hero and spiders collide each other
  this.game.physics.arcade.overlap( this.hero, this.spiders, this._onHeroVsEnemy, null, this );

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

// battle between the hero and the spiders. This event is tiggered when they overlap each other
PlayState._onHeroVsEnemy = function( hero, enemy ) {
  
  /**
   * Hero kills enemies when failling . To detect if is failling
   * we need to check the velocity in coordinate y
   */
  // kill enemies when the hero is failing
  if( hero.body.velocity.y > 0 ) {
  	hero.bounce();
  	enemy.die();
  	this.sfx.stomp.play();   // dispaly the stomp sound
  }
  else {
  	//game over -> restart the game
    this.sfx.stomp.play(); 
    this.game.state.restart();
  }

};

// load game assets here
PlayState.preload = function() {

	/**
	 * Load hero image - Static image is commmented
	 * after adding sprites to animate the main hero
	 */
	// this.game.load.image( 'hero', 'images/hero_stopped.png' );

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
  this.game.load.image( 'icon:coin', 'images/coin_icon.png' );

  // audio
  this.game.load.audio( 'sfx:jump', 'audio/jump.wav' );
  this.game.load.audio( 'sfx:coin', 'audio/coin.wav' );
  this.game.load.audio( 'sfx:stomp', 'audio/stomp.wav' );

  // coins
  this.game.load.spritesheet( 'coin', 'images/coin_animated.png', 22, 22 );

  // fonts
  this.game.load.image( 'font:numbers', 'images/numbers.png');

  // hero
  this.game.load.spritesheet( 'hero', 'images/hero.png', 36, 42 );

  // spiders
  this.game.load.spritesheet( 'spider', 'images/spider.png', 42, 32 );

  // door
  this.game.load.spritesheet( 'door', 'images/door.png', 42, 66 );

  // key
  this.game.load.image( 'key', 'images/key.png' );

};

// create game entities and set up world here
PlayState.create = function() {

	// create sound entities
	this.sfx = {
		jump : this.game.add.audio( 'sfx:jump' ),
		coin : this.game.add.audio( 'sfx:coin' ),
		stomp : this.game.add.audio( 'sfx:stomp' )
	};

	// create background image
	this.game.add.image( 0, 0, 'background' );

	// create level 1 data
	this._loadLevel( this.game.cache.getJSON( 'level:1' ) );

	// add Hud
	this._createHud();
}

/**
 * Check the methods defined below load level as load level
 * loginc has been splited
 */
PlayState._loadLevel = function( data ) {

	const GRAVITY = 1200;

	// create all the groups / layers that we need
	this.bgDecoration = this.game.add.group();
	this.platforms    = this.game.add.group();
	this.coins        = this.game.add.group();
	this.spiders      = this.game.add.group(); 
	this.enemyWalls   = this.game.add.group();

	// spawn all platforms
	data.platforms.forEach( this._spawnPlatform, this );

	// spawn hero and enemies
	this._spawnCharacters( { hero: data.hero, spiders: data.spiders } );

	// spawn important objects
  data.coins.forEach( this._spawnCoin, this );
  this._spawnDoor( data.door.x, data.door.y );
  this._spawnKey( data.key.x, data.key.y );

	// enable gravity here
	this.game.physics.arcade.gravity.y = GRAVITY;

	// make enemy walls invisible
	this.enemyWalls.visible = false;
};

/**
 * Render Hud ( User Interface Elements )
 */
PlayState._createHud = function() {
 
 /**
  * When adding a retrofont , we need to specify 'what'
  * the retrofont contains
  */
 const NUMBERS_STR = '0123456789X ';
 this.coinFont     = this.game.add.retroFont( 'font:numbers', 20, 26, NUMBERS_STR, 6 );

 // make the game to create the image using the icon coin.
 // The parameters are the screen coordinates
 let coinIcon      = this.game.make.image( 0 , 0, 'icon:coin' );

 /**
  * Make the game to add the score image
  *
  * Remember to do this to add retro fonts
  */
 let coinScoreImg  = this.game.make.image( coinIcon.x + coinIcon.width, coinIcon.height / 2, 
 	                   this.coinFont );
 coinScoreImg.anchor.set( 0 , 0.5 );

 this.hud = this.game.add.group();
 this.hud.add( coinIcon );
 this.hud.position.set( 10, 10 );
 this.hud.add( coinScoreImg );


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

// spawn door and add physics to it
PlayState._spawnDoor = function( x, y ) {
	this.door = this.bgDecoration.create( x, y, 'door' );
	this.door.anchor.setTo( 0.5, 1);

   // enable physics
   this.game.physics.enable( this.door );
   this.door.body.allowGravity = false;
};

// spawn key and add physcs to it
PlayState._spawnKey = function( x, y ) {
	this.key = this.bgDecoration.create(x, y, 'key' );
	this.key.anchor.set( 0.5, 0.5 );

	// enable physics
	this.game.physics.enable( this.key );
	this.key.body.allowGravity = false;
};

// tiggered when the hero overlaps a coin
PlayState._onHeroVsCoin = function( hero, coin ) {
	this.sfx.coin.play();
	coin.kill();
	this.coinPickupCount++;
};

// init phaser
window.onload = function () {
    let game = new Phaser.Game( 960, 600, Phaser.AUTO, 'game');
    game.state.add( 'play', PlayState );
    game.state.start( 'play' );
};