import { _decorator, Component, Node, Sprite, SpriteFrame, tween, UITransform, v3 } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
const { ccclass, property } = _decorator;

@ccclass("Vehicle")
export class Vehicle extends Component {
    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(Node)
    vehicleRandomEndPoint: Node = null;

    @property(Node)
    vehicleHitBarrierEndPoint: Node = null;

    @property(Node)
    vehicleHitCrashEndPoint: Node = null;

    @property(SpriteFrame)
    vehicles: SpriteFrame[] = [];

    isPLayingAnimation = false;
    isSpawning = false;
    minSpawnInterval = 2;
    maxSpawnInterval = 5;

    private vehicleAnimationDuration = 0;
    vehicleStartTime = 0;

    currentVehicleSpriteFrame: SpriteFrame = null;
    onLoad() {
        this.resetVehicle();
    }

    private randomVehicle() {
        this.currentVehicleSpriteFrame = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        this.node.getComponent(UITransform).height = this.currentVehicleSpriteFrame.originalSize.height;
        this.node.getComponent(UITransform).width = this.currentVehicleSpriteFrame.originalSize.width;
        this.vehicleNode.getComponent(Sprite).spriteFrame = this.currentVehicleSpriteFrame;
    }

    private async spawnVehicle() {
        const vehicleStartPos = this.vehicleStartPoint.position;
        this.vehicleNode.setPosition(vehicleStartPos);

        this.isPLayingAnimation = true;
        this.vehicleStartTime = Date.now(); // Record start time
        this.randomVehicle();
        this.vehicleNode.active = true;
        this.vehicleAnimationDuration = this.getRandomVehicleDuration();
        // Create a promise to track when the tween finishes
        await new Promise<void>((resolve) => {
            tween(this.vehicleNode)
                .to(this.vehicleAnimationDuration, { position: v3(0, -vehicleStartPos.y, 0) })
                .call(() => resolve()) // Resolve when tween completes
                .start();
        });

        this.resetVehicle();
        this.isPLayingAnimation = false;
    }

    private getRandomVehicleDuration(): number {
        return Math.floor(Math.random() * 2) + 1;
    }

    // Get how much time has elapsed since the vehicle started
    private getElapsedTime(): number {
        if (!this.isPLayingAnimation) {
            return 0;
        }
        return (Date.now() - this.vehicleStartTime) / 1000;
    }

    // Get remaining time until vehicle animation completes
    getRemainingTime(): number {
        if (!this.isPLayingAnimation) {
            return 0;
        }
        const elapsed = this.getElapsedTime();
        return Math.max(0, this.vehicleAnimationDuration - elapsed);
    }

    resetVehicle() {
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.vehicleNode.active = false;
    }

    startRandomSpawning() {
        if (this.isSpawning) {
            return;
        }
        this.isSpawning = true;
        this.scheduleNextSpawn();
    }

    private scheduleNextSpawn() {
        if (!this.isSpawning) {
            return;
        }

        const randomInterval = Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + this.minSpawnInterval;
        this.scheduleOnce(async () => {
            if (this.isSpawning && !this.isPLayingAnimation) {
                await this.spawnVehicle();
            }
            this.scheduleNextSpawn();
        }, randomInterval);
    }

    stopSpawnVehicle() {
        this.isSpawning = false;
        this.unscheduleAllCallbacks();
        this.resetVehicle();
    }

    playVehicleStopAtBarrier() {
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.randomVehicle();
        this.vehicleNode.active = true;
        const vehicleEndPointPos = this.vehicleHitBarrierEndPoint.position;
        tween(this.vehicleNode)
            .to(0.5, { position: v3(vehicleEndPointPos.x, vehicleEndPointPos.y, 0) })
            .start();
    }

    async playCrashVehicle() {
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.vehicleNode.active = true;

        this.randomVehicle();
        const vehicleStartPos = this.vehicleHitCrashEndPoint.position;
        tween(this.vehicleNode)
            .to(2, { position: v3(0, vehicleStartPos.y, 0) })
            .start();
        await AnimationUtils.delayTime(2);
        this.resetVehicle();
    }
}
