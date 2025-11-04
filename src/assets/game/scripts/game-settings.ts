const GAME_NAME = "ChickenRoad";

export const settings = {
    id: 157,
    name: GAME_NAME,
    observerNamespace: GAME_NAME,
    namespaces: [GAME_NAME],
    durations: {
        wholeRound: 14,
        lockingBet: 3,
        placingBet: 10,
        generatingResult: 0,
        startRound: 1,

        bigWinNotice: 5,
        normalWinNotice: 3,
        crashAnimation: 5,
        winAnimation: 7,
    },
    numberOfRoundHistory: 11,
    validateBalanceWhenBet: true,
    gameTypeId: 13,
};
