import * as Phaser from 'phaser';
const GAME_SPEED = 300;


class Crate extends Phaser.GameObjects.Sprite {
    public idleTimer: any;
    constructor(scene: Phaser.Scene, x: number, y: number, private crateType: number) {
        super(scene, x, y, 'assets', getStartFrame(crateType));
        this.setOrigin(0,0);
    }

    onCorrectLocation(goal){
        return false;
    }


    moveTo(newX: number, newY: number,newTile) {
        this.state = 'moving';
        this.scene.tweens.add({
            targets: this,
            x: newX,
            y: newY,
            duration: GAME_SPEED,
            onStart: this.onMoveStart,
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
            //this.setFrame(START_FRAME);
            this.idleTimer = null;
        }, [], this);
    }

}

const getStartFrame = (crateType: number) : string => `Crates/crate_${crateType}`;

export default Crate;
