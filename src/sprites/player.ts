import * as Phaser from 'phaser';

const START_FRAME = 'Player/player_05';
const GAME_SPEED = 300;


class Player extends Phaser.GameObjects.Sprite {
    public idleTimer: any;
    constructor(scene: Phaser.Scene, x: number, y: number) {

        super(scene, x, y, 'assets', START_FRAME);
        this.setOrigin(0, 0);
    }

    moveTo(newX: number, newY: number) {
        const direction = this.getDirection(newX, newY);
        if (!direction) {
            return;
        }
        this.state = 'moving';
        this.scene.tweens.add({
            targets: this,
            x: newX,
            y: newY,
            duration: GAME_SPEED,
            onStart: this.onMoveStart,
            onStartParams: [direction],
            onComplete: this.onMoveComplete,
        });
    }

    private onMoveStart = (tween: Phaser.Tweens.Tween, object: Phaser.GameObjects.GameObject, direction) => {
        this.state = 'moving';
        //this.anims.play(direction);

        if (this.idleTimer) {
            this.idleTimer.destroy();
        }
    }

    private onMoveComplete = () => {
        this.state = 'standing';
        //this.anims.stop();

        // in the final version we have undos and restarts that destroys our player
        // this check ensures that the callback doesnt crash
        if (!this.scene) {
            return;
        }

        // reset player to start frame after movement is complete
        this.idleTimer = this.scene.time.delayedCall(500, () => {
            this.setFrame(START_FRAME);
            this.idleTimer = null;
        }, [], this);
    }

    private getDirection(newX: number, newY: number) {
        if (newX > this.x) {
            return 'playerRight';
        }
        if (newX < this.x) {
            return 'playerLeft';
        }
        if (newY > this.y) {
            return 'playerDown';
        }
        if (newY < this.y) {
            return 'playerUp';
        }
        return null;
    }
}

export default Player;
