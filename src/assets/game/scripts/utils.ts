import { Color, Node } from "cc";

export const MULTIPLIER_THRESHOLDS = {
    LEVEL_4: 100,
    LEVEL_3: 10,
    LEVEL_2: 1.1,
    LEVEL_1: 0,
};

export const MULTIPLIER_FONT_NAME = ["blue", "yellow", "red", "purple"];

export const getCurrentAnimationLevel = (multiplier: number): number => {
    const { LEVEL_4, LEVEL_3, LEVEL_2 } = MULTIPLIER_THRESHOLDS;
    if (multiplier >= LEVEL_4) {
        return 4;
    }
    if (multiplier >= LEVEL_3) {
        return 3;
    }
    if (multiplier >= LEVEL_2) {
        return 2;
    }

    return 1;
};

export const resetCursor = () => {
    document.body.style.cursor = "default";
};

export const changeCursorPointer = () => {
    document.body.style.cursor = "pointer";
};

export const changePointerWhenHover = (node: Node) => {
    node.on(Node.EventType.MOUSE_MOVE, changeCursorPointer, this);
    node.on(Node.EventType.MOUSE_LEAVE, resetCursor, this);
};

export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

export const formatTime = (isoString: string): string => {
    const date = new Date(isoString);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
}

