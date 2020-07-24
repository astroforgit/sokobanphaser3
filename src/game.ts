import "phaser";
import { MainScene } from "./scenes/mainScene";
import { LevelScene } from "./scenes/levelScene";
import { WIDTH, HEIGHT } from "./constants";

// main game configuration
const config: GameConfig = {
  width: WIDTH,
  height: HEIGHT,
  type: Phaser.AUTO,
  parent: "game",
  scene: LevelScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  }
};

// game class
export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

// when the page is loaded, create our game instance
window.addEventListener("load", () => {
  var game = new Game(config);
});
