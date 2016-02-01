declare interface TierModel {
    tier : number;
    upgradeGoldCost : number;
    upgradeShardCost ?: number;
    upgradeSizeRequirement ?: number;
    description : string;
}

declare interface TownModel {
    currentGold : number;
    currentShards : number;
    size : number;
    gnarfHQ : number;
    taverne : number;
    farm : number;
    townGuard : number;
    hospital : number;
    tradingPost : number;
    shrine : number;
    library : number;
    stables : number;
    barracks : number;
    alchemist : number;
    blacksmith : number;
}
