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

    onLoad() {
        this.resetVehicle();

        super.onLoad();
    }

    async spawnVehicle() {
        this.isPLayingAnimation = true;
        const randomVehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        this.vehicleNode.getComponent(Sprite).spriteFrame = randomVehicle;
        const vehicleStartPos = this.vehicleStartPoint.position;
        this.vehicleNode.active = true;
        tween(this.vehicleNode)
            .to(2.2, { position: v3(0, -vehicleStartPos.y, 0) })
            .start();
        await AnimationUtils.delayTime(3);
        this.resetVehicle();
        this.isPLayingAnimation = false;
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
