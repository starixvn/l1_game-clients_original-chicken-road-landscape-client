import { _decorator, Node, Sprite, SpriteFrame, tween, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("RandomVehicleController")
export class RandomVehicleController extends ObserverComponent {
    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(SpriteFrame)
    vehicles: SpriteFrame[] = [];

    isPLayingAnimation = false;
    isSpawning = false;
    minSpawnInterval = 2;
    maxSpawnInterval = 5;
    vehicleAnimationDuration = 2.2; // Track the animation duration
    vehicleStartTime = 0; // Track when the vehicle started

    onLoad() {
        this.resetVehicle();

        super.onLoad();
    }

    async spawnVehicle() {
        this.isPLayingAnimation = true;
        this.vehicleStartTime = Date.now(); // Record start time
        const randomVehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        this.vehicleNode.getComponent(Sprite).spriteFrame = randomVehicle;
        const vehicleStartPos = this.vehicleStartPoint.position;
        this.vehicleNode.active = true;
        
        // Create a promise to track when the tween finishes
        await new Promise<void>((resolve) => {
            tween(this.vehicleNode)
                .to(this.vehicleAnimationDuration, { position: v3(0, -vehicleStartPos.y, 0) })
                .call(() => resolve()) // Resolve when tween completes
                .start();
        });
        
        // Wait a bit more after vehicle reaches the end
        await AnimationUtils.delayTime(0.8);
        this.resetVehicle();
        this.isPLayingAnimation = false;
    }

    // Get how much time has elapsed since the vehicle started
    getElapsedTime(): number {
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

    setVehicleLandPosition(landPosition: Vec3) {
        this.node.setPosition(landPosition);
    }

    startRandomSpawning() {
        if (this.isSpawning) {
            return;
        }
        this.isSpawning = true;
        this.scheduleNextSpawn();
    }

    scheduleNextSpawn() {
        if (!this.isSpawning) {
            return;
        }

        const randomInterval = Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + this.minSpawnInterval;
        this.scheduleOnce(() => {
            if (this.isSpawning && !this.isPLayingAnimation) {
                this.spawnVehicle();
            }
            this.scheduleNextSpawn();
        }, randomInterval);
    }

    stopSpawnVehicle() {
        this.isSpawning = false;
        this.unscheduleAllCallbacks();
        this.resetVehicle();
    }
}
