import { _decorator, Component, Node, sp, tween, v3 } from "cc";
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

    @property(sp.Skeleton)
    vehicleSkeleton: sp.Skeleton = null;

    isPLayingAnimation = false;
    isSpawning = false;
    minSpawnInterval = 2;
    maxSpawnInterval = 5;

    private vehicleAnimationDuration = 0;
    vehicleStartTime = 0;

    private animationNames: string[] = [];
    private currentAnimName = "";

    onLoad() {
        this.cacheAnimationNames();
        this.resetVehicle();
    }

    private cacheAnimationNames() {
        if (this.vehicleSkeleton && this.vehicleSkeleton.skeletonData) {
            const anims = this.vehicleSkeleton.skeletonData.getAnimsEnum();
            this.animationNames = Object.keys(anims).filter((name) => name !== "<None>");
        }
    }

    private randomVehicle() {
        if (this.animationNames.length === 0) {
            console.error("No animation names found");
            return;
        }
        const randomIndex = Math.floor(Math.random() * this.animationNames.length); //NOSONAR
        this.currentAnimName = this.animationNames[randomIndex];
        this.vehicleSkeleton.setAnimation(0, this.currentAnimName, true);
    }

    private async spawnVehicle() {
        const startPos = this.vehicleStartPoint.position;
        this.vehicleNode.setPosition(startPos);

        this.isPLayingAnimation = true;
        this.vehicleStartTime = Date.now();
        this.randomVehicle();
        this.vehicleNode.active = true;

        this.vehicleAnimationDuration = this.getRandomVehicleDuration();

        await new Promise<void>((resolve) => {
            tween(this.vehicleNode)
                .to(this.vehicleAnimationDuration, { position: v3(0, -startPos.y, 0) })
                .call(() => resolve())
                .start();
        });

        this.resetVehicle();
        this.isPLayingAnimation = false;
    }

    private getRandomVehicleDuration(): number {
        return Math.floor(Math.random() * 2) + 1;
    }

    private getElapsedTime(): number {
        if (!this.isPLayingAnimation) {
            return 0;
        }
        return (Date.now() - this.vehicleStartTime) / 1000;
    }

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
        const barrierHeight = 200;
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.randomVehicle();
        this.vehicleNode.active = true;

        const barrierEndY = this.vehicleHitBarrierEndPoint.position.y + barrierHeight;

        tween(this.vehicleNode)
            .to(0.5, { position: v3(0, barrierEndY, 0) })
            .start();
    }

    async playCrashVehicle() {
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.vehicleNode.active = true;
        this.randomVehicle();

        const crashEndPos = this.vehicleHitCrashEndPoint.position;
        tween(this.vehicleNode)
            .to(2, { position: v3(0, crashEndPos.y, 0) })
            .start();

        await AnimationUtils.delayTime(2);
        this.resetVehicle();
    }
}
