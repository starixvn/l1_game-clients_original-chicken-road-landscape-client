import { _decorator, Component, Node, sp, tween, v3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Vehicle")
export class Vehicle extends Component {
    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(Node)
    vehicleHitBarrierEndPoint: Node = null;

    @property(Node)
    vehicleHitCrashEndPoint: Node = null;

    @property(sp.Skeleton)
    vehicleSkeleton: sp.Skeleton = null;

    isMoving = false;
    isSpawning = false;
    minSpawnInterval = 2;
    maxSpawnInterval = 5;

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

    private spawnVehicle() {
        const startPos = this.vehicleStartPoint.position;
        this.vehicleNode.setPosition(v3(startPos));

        this.isMoving = true;
        this.randomVehicle();
        this.vehicleNode.active = true;
        const movingDuration = this.getRandomVehicleDuration();
        const speed = v3(0, -startPos.y, 0).subtract(this.vehicleStartPoint.position).length() / movingDuration;
        console.log(this.node.parent.name + "speed normal ", speed);
        return new Promise<void>((resolve) => {
            tween(this.vehicleNode)
                .to(movingDuration, { position: v3(0, -startPos.y, 0) })
                .call(() => {
                    this.resetVehicle();
                    this.isMoving = false;
                    resolve();
                })
                .start();
        });
    }

    private getRandomVehicleDuration(): number {
        return Math.floor(Math.random() * 2) + 1; //NOSONAR
    }

    resetVehicle() {
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
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

        const randomInterval = Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + this.minSpawnInterval; //NOSONAR
        this.scheduleOnce(async () => {
            if (this.isSpawning && !this.isMoving) {
                await this.spawnVehicle();
            }
            this.scheduleNextSpawn();
        }, randomInterval);
    }

    stopSpawningVehicle() {
        this.isSpawning = false;
        this.unscheduleAllCallbacks();
    }

    playVehicleStopAtBarrier() {
        const barrierHeight = 200;
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
        this.randomVehicle();
        this.vehicleNode.active = true;

        const barrierEndY = this.vehicleHitBarrierEndPoint.position.y + barrierHeight;

        const duration = 0.4;
        const speed = v3(0, barrierEndY, 0).subtract(this.vehicleStartPoint.position).length() / duration;
        console.log(this.node.parent.name + "speed barrie ", speed);
        tween(this.vehicleNode)
            .to(duration, { position: v3(0, barrierEndY, 0) })
            .start();
    }

    playCrashVehicle(onCollision: () => void) {
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
        this.vehicleNode.active = true;
        this.randomVehicle();

        const crashEndPos = this.vehicleHitCrashEndPoint.position;
        const duration = 1;
        const speed = v3(crashEndPos).subtract(this.vehicleStartPoint.position).length() / duration;
        console.log(this.node.parent.name + "speed crash ", speed);
        let isCollision = false;
        tween(this.vehicleNode)
            .to(duration, { position: v3(0, crashEndPos.y, 0) }, {
                onUpdate(target, ratio) {
                    if (ratio > 0.5 && !isCollision) {
                        isCollision = true;
                        onCollision();
                    }
                }
            })
            .start();
    }
}
