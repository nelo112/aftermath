import { Injectable } from 'angular2/core';
import { CharacterConnector } from '../connector/character-connector';

@Injectable()
export class CharacterService {

    constructor (private connector : CharacterConnector) {}

    getCharacters () : Promise<CharacterModel[]> {
        return this.connector.getCharacters();
    }

    getAchievements () : Promise<ItemModel[]> {
        return this.connector.getAchievements();
    }

    getItems () : Promise<AchievementModel[]> {
        return this.connector.getItems();
    }
}