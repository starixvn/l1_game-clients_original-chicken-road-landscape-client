import { _decorator, Component, log, Node, sp, Tween, tween, v3 } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AudioIds } from "../../../audios/AudioIds";
const { ccclass, property } = _decorator;
enum VehicleState {
    None = "none",
    Normal_Moving = "moving",
    Stopped_At_Barrier = "stopped_at_barrier",
    Stopped_At_Crash = "stopped_at_crash",
    Moving_Last_Step = "moving_last_step",
}

@ccclass("Vehicle")
export class Vehicle extends Component {
    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(Node)
    vehicleHitBarrierEndPoint: Node = null;

    @property(Node)
    vehicleEndPoint: Node = null;

    @property(sp.Skeleton)
    vehicleSkeleton: sp.Skeleton = null;

    state: VehicleState = VehicleState.None;
    isSpawning = false;
    minSpawnInterval = 2;
    maxSpawnInterval = 5;

    private animationNames: string[] = [];
    private currentAnimName = "";

    onLoad() {
        this.cacheAnimationNames();
        this.resetPosition();
    }

    reset() {
        this.state = VehicleState.None;
        this.resetPosition();
        this.isSpawning = false;
        Tween.stopAllByTarget(this.vehicleNode);
    }

    private cacheAnimationNames() {
        if (this.vehicleSkeleton && this.vehicleSkeleton.skeletonData) {
            const anims = this.vehicleSkeleton.skeletonData.getAnimsEnum();
            this.animationNames = Object.keys(anims).filter((name) => name !== "<None>");
        }
    }

    private randomVehicle() {
        if (this.animationNames.length === 0) {
            log("No animation names found for vehicle");
            return;
        }
        const randomIndex = Math.floor(Math.random() * this.animationNames.length); //NOSONAR
        this.currentAnimName = this.animationNames[randomIndex];
        this.vehicleSkeleton.setAnimation(0, this.currentAnimName, true);
    }

    private spawnVehicle() {
        if (this.state === VehicleState.Stopped_At_Barrier || this.state === VehicleState.Stopped_At_Crash) {
            log("spawnVehicle ERRRRRRRRRRRR", this.node.parent.name);
            return Promise.resolve();
        }
        const startPos = this.vehicleStartPoint.position;
        const endPos = this.vehicleEndPoint.position;
        this.vehicleNode.setPosition(v3(startPos));

        this.state = VehicleState.Normal_Moving;
        this.randomVehicle();
        this.vehicleNode.active = true;
        const movingDuration = this.getRandomVehicleDuration();
        return new Promise<void>((resolve) => {
            tween(this.vehicleNode)
                .to(movingDuration, { position: v3(0, endPos.y, 0) })
                .call(() => {
                    if (this.state !== VehicleState.Stopped_At_Barrier && this.state !== VehicleState.Stopped_At_Crash) {
                        this.resetPosition();
                    }
                    this.state = VehicleState.None;
                    resolve();
                })
                .start();
        });
    }

    private getRandomVehicleDuration(): number {
        return (Math.random() * 0.5) + 1; //NOSONAR
    }

    resetPosition() {
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
        this.unscheduleAllCallbacks();
        this.scheduleOnce(async () => {
            if (this.isSpawning) {
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
        if (this.state === VehicleState.Normal_Moving) {
            log("playVehicleStopAtBarrier ERRRRRRRRRRRR", this.node.parent.name);
            Tween.stopAllByTarget(this.vehicleNode);
        }
        this.state = VehicleState.Stopped_At_Barrier;
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
        this.randomVehicle();
        this.vehicleNode.active = true;
        const barrierEndY = this.vehicleHitBarrierEndPoint.position.y;
        const duration = 0.25;
        AudioUtils.playSFX(AudioIds.CAR_STOP);
        tween(this.vehicleNode)
            .to(duration, { position: v3(0, barrierEndY, 0) })
            .start();
    }

    playLastLane() {
        if (this.state === VehicleState.Normal_Moving) {
            log("playCrashVehicle ERRRRRRRRRRRR", this.node.parent.name);
            Tween.stopAllByTarget(this.vehicleNode);
        }
        this.state = VehicleState.Moving_Last_Step;
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
        this.vehicleNode.active = true;
        this.randomVehicle();

        const endPos = this.vehicleEndPoint.position;
        const duration = 1;
        tween(this.vehicleNode)
            .to(duration, { position: v3(0, endPos.y, 0) })
            .start();
    }

    playCrashVehicle(onCollision: () => void) {
        if (this.state === VehicleState.Normal_Moving) {
            Tween.stopAllByTarget(this.vehicleNode);
        }
        this.state = VehicleState.Stopped_At_Crash;
        this.vehicleNode.setPosition(v3(this.vehicleStartPoint.position));
        this.vehicleNode.active = true;
        this.randomVehicle();

        const endPos = this.vehicleEndPoint.position;
        const duration = 1;
        let isCollision = false;
        tween(this.vehicleNode)
            .to(duration, { position: v3(0, endPos.y, 0) }, {
                onUpdate(target, ratio) {
                    if (ratio > 0.2 && !isCollision) {
                        isCollision = true;
                        onCollision();
                    }
                }
            })
            .start();
    }
}
