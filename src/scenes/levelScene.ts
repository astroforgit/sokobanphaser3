import * as Phaser from 'phaser';
import Crate from '../sprites/crate';
import Player from '../sprites/player';

export type PlayerDirection = 'playerLeft' | 'playerRight' | 'playerUp' | 'playerDown';

export class LevelScene extends Phaser.Scene {
    private player: Player
    private crates: Phaser.GameObjects.Group;

    private tileSet: Phaser.Tilemaps.Tileset;
    private tileMap: Phaser.Tilemaps.Tilemap;

    private floorLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private wallLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private spawnLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private goalLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private crateLayer: Phaser.Tilemaps.StaticTilemapLayer;

    private leftKeys: Phaser.Input.Keyboard.Key[];
    private rightKeys: Phaser.Input.Keyboard.Key[];
    private upKeys: Phaser.Input.Keyboard.Key[];
    private downKeys: Phaser.Input.Keyboard.Key[];

    constructor() {
        super({
            key: 'LevelScene',
        });
    }

    preload() : void {
        this.load.atlas('assets', './assets/assets.png', './assets/assets.json');
        this.load.tilemapTiledJSON('level1', './assets/levels/level1.json');
    }

    create() : void {
        this.tileMap = this.make.tilemap({ key: 'level1' });
        this.tileSet = this.tileMap.addTilesetImage('assets');

        this.createLevel();
        this.createPlayer();
        this.createGridLines();
        //this.centerCamera();
        this.createInputHandler();
        //this.cameras.main.startFollow(this.player);
        this.updatePlayer(this.getPlayerDirection());

    }

    update(time: number, delta: number): void {
        //console.log('update!!!!');
        if (!this.player.state ||  this.player.state!='moving'){
            this.updatePlayer(this.getPlayerDirection());
        }

    }

    private getCrateAt(tileX: number, tileY: number): Crate | null {
        const allCrates = this.crates.getChildren() as Crate[];
        const { x, y } = this.tileMap.tileToWorldXY(tileX, tileY);
        const crateAtLocation = allCrates.filter((crate) => {
            return crate.x === x && crate.y === y;
        });
        if (crateAtLocation.length === 0) {
            return null;
        }
        return crateAtLocation[0];
    }


    private checkIfLocationIsFree(tileX: number, tileY: number): boolean {
        if (tileX < 0 || tileX >= this.tileMap.width || tileY < 0 || tileY >= this.tileMap.height) {
            return false;
        }
        const hasWall = !!this.wallLayer.getTileAt(tileX, tileY);
        if (hasWall) {
            return false;
        }
        const crate = this.getCrateAt(tileX, tileY);
        return !crate;
    }

    private getNextTile(start,direction,layer)  {
        const { x, y } = start;
        switch (direction) {
            case 'playerDown':
                return layer.getTileAt(x, y + 1);
            case 'playerUp':
                return layer.getTileAt(x, y - 1);
            case 'playerLeft':
                return layer.getTileAt(x - 1, y);
            case 'playerRight':
                return layer.getTileAt(x + 1, y);
            default:
                throw new Error('Unexpected direction');
        }
    }

    private updatePlayer(direction: PlayerDirection | null) {
        console.log('update player direc',direction);
        if (!direction) {
            return;
        }
        this.troToMovePlayer(direction);
    }

    private troToMovePlayer(direction: PlayerDirection) {
        const { x, y } = this.player;
        const currentTile = this.tileMap.getTileAtWorldXY(x, y, true);
        const wall = this.getNextTile(currentTile, direction, this.wallLayer);
        if (wall) { // out of bounds
            return;
        }
        if (wall && wall.index > -1) {
            return;
        }
        const floor = this.getNextTile(currentTile, direction, this.floorLayer);
        if (!floor) { // out of bounds
            return;
        }

        const crate = this.getCrateAt(floor.x, floor.y);

        if (crate) {
            const oneFurther = this.getNextTile(floor, direction, this.floorLayer);
            if ((!oneFurther)) { // out of bounds
                return false;
            }
            if (!this.checkIfLocationIsFree(oneFurther.x, oneFurther.y)) {
                return false;
            }
        }

        this.movePlayer(floor.x, floor.y);
    }

    private movePlayer(tileX: number, tileY: number) {
        const { x, y } = this.tileMap.tileToWorldXY(tileX, tileY);
        const crate = this.getCrateAt(tileX, tileY);
        if (crate) {
            // not the prettiest way, we simply move the crate along the same direction
            // knowing that the next spot is available
            const crateX = crate.x + x - this.player.x;
            const crateY = crate.y + y - this.player.y;
            const newTile = this.floorLayer.getTileAtWorldXY(crateX, crateY);
            crate.moveTo(crateX, crateY, newTile);
        }
        this.player.moveTo(x, y);
    }


    private createLevel() : void {
        this.createLayers();
        this.createCrates();
    }

    private createLayers() : void {
        const x = 0;
        const y = 0;

        this.spawnLayer = this.tileMap.createStaticLayer('Spawns', this.tileSet, x, y);
        this.spawnLayer.setVisible(false);

        this.crateLayer = this.tileMap.createStaticLayer('Crates', this.tileSet, x, y);
        this.crateLayer.setVisible(false);

        this.floorLayer = this.tileMap.createStaticLayer('Floors', this.tileSet, x, y);
        this.wallLayer = this.tileMap.createStaticLayer('Walls', this.tileSet, x, y);
        this.goalLayer = this.tileMap.createStaticLayer('Goals', this.tileSet, x, y);
    }

    private createCrates() : void {
        const createTiles = this.getTiles((tile) => {
            return tile.index > -1;
        }, this.crateLayer);

        const crateSprites = createTiles.map((tile) => {
            const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
            const crate = new Crate(this, x, y, tile.index);
            this.add.existing(crate);

            return crate;
        });

        this.crates = this.add.group(crateSprites);
    }

    private createPlayer() : void {
        const playerSpawn = this.getSpawn();
        const { x ,y } = this.tileMap.tileToWorldXY(playerSpawn.x, playerSpawn.y);

        this.player = new Player(this, x, y);
        this.add.existing(this.player);
    }

    private getSpawn() : Phaser.Tilemaps.Tile {
        const spawns = this.getTiles((tile) => {
            return tile.index > -1;
        }, this.spawnLayer);

        if (spawns.length !== 1) {
            throw new Error('[LevelScene] Expected single spawn');
        }

        return spawns[0];
    }

    private getTiles(
        test: (tile: Phaser.Tilemaps.Tile) => boolean,
        layer?: Phaser.Tilemaps.StaticTilemapLayer
    ): Phaser.Tilemaps.Tile[] {
        this.tileMap.setLayer(layer || this.floorLayer);

        return this.tileMap.filterTiles((tile: Phaser.Tilemaps.Tile) => {
            return test(tile);
        }, this, 0, 0, this.tileMap.width, this.tileMap.height);
    }

    private createGridLines() {
        const lineLength = 6;
        const skipLength = 2;
        this.addVerticalLines(lineLength, skipLength);
        this.addHorizontalLines(lineLength, skipLength);
    }

    private addVerticalLines(lineLength: number, skipLength: number) {
        let currentX = 0;
        const stopX = this.tileMap.widthInPixels;
        const stopY = this.tileMap.heightInPixels;

        const next = (x: number, y: number) => ({ x: x, y: y + lineLength });
        const skip = (x: number, y: number) => ({ x: x, y: y + skipLength });
        const stop = (x: number, y: number) => y >= stopY;

        while (currentX <= stopX) {
            this.addGridLine(currentX, 0, next, skip, stop);
            currentX += this.tileMap.tileWidth;
        }
    }

    private addHorizontalLines(lineLength: number, skipLength: number) {
        let currentY = 0;
        const stopX = this.tileMap.widthInPixels;
        const stopY = this.tileMap.heightInPixels;

        const next = (x: number, y: number) => ({ x: x + lineLength, y: y });
        const skip = (x: number, y: number) => ({ x: x + skipLength, y: y });
        const stop = (x: number, y: number) => x >= stopX;

        while (currentY <= stopY) {
            this.addGridLine(0, currentY, next, skip, stop);
            currentY += this.tileMap.tileHeight;
        }
    }

    private addGridLine(
        startX: number,
        startY: number,
        next: (x: number, y: number) => { x: number, y: number },
        skip: (x: number, y: number) => { x: number, y: number },
        stop: (x: number, y: number) => boolean,
    ) {
        let currentX = startX;
        let currentY = startY;

        const line = this.add.graphics({
            x: 0,
            y: 0,
            lineStyle: { width: 1, alpha: 0.5, color: 0x000000 },
            fillStyle: { color: 0x000000, alpha: 1 },
        });

        line.beginPath();
        line.moveTo(startX, startY);

        while(!stop(currentX, currentY)) {
            const { x: nextX, y: nextY } = next(currentX, currentY);
            line.lineTo(nextX, nextY);

            const { x: skipX, y: skipY } = skip(nextX, nextY);
            line.moveTo(skipX, skipY);

            currentX = skipX;
            currentY = skipY;
        }

        line.closePath();
        line.strokePath();
        line.fillPath();
    }

    private centerCamera() : void {
        const bounds = this.physics.world.bounds;

        const x = bounds.width / 2 - this.tileMap.widthInPixels / 2;
        const y = bounds.height / 2 - this.tileMap.heightInPixels / 2;

        this.cameras.remove(this.cameras.main);

        const camera = this.cameras.add(x, y, this.tileMap.widthInPixels, this.tileMap.heightInPixels, true);
        camera.setOrigin(0, 0);
        camera.setScroll(0, 0);
    }

    private createInputHandler() {
        this.leftKeys = [Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.Q].map((key) => {
          return this.input.keyboard.addKey(key);
        });
        this.rightKeys = [Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D].map((key) => {
          return this.input.keyboard.addKey(key);
        });
        this.upKeys = [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.Z].map((key) => {
          return this.input.keyboard.addKey(key);
        });
        this.downKeys = [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S].map((key) => {
          return this.input.keyboard.addKey(key);
        });
      }

      private getPlayerDirection(): PlayerDirection | null {
        if (this.leftKeys.some((key) => key.isDown)) {
          return 'playerLeft';
        }
        if (this.rightKeys.some((key) => key.isDown)) {
          return 'playerRight';
        }

        if (this.upKeys.some((key) => key.isDown)) {
          return 'playerUp';
        }
        if (this.downKeys.some((key) => key.isDown)) {
          return 'playerDown';
        }
        return null;
      }

    private hasPlayerWon(): boolean {
        return this.allCratesInCorrectLocation();
    }


    private allCratesInCorrectLocation(): boolean {
        const crates = this.crates.getChildren() as Crate[];
        const inCorrectLocation = crates.filter((crate) => {
            const goal = this.goalLayer.getTileAtWorldXY(crate.x, crate.y);
            if (!goal) {
                return false;
            }
            return crate.onCorrectLocation(goal);
        });
        const goalTiles = this.getTiles((tile) => {
            return tile.index > 1;
        }, this.goalLayer);
        return inCorrectLocation.length === goalTiles.length;
    }




}
