import { Injectable } from 'angular2/core';
import { Http } from 'angular2/http';
import { Observable } from 'rxjs/Rx';
import { AchievementModel } from '../model/achievement';
import { ItemModel } from '../model/item';
import { CharacterDetailsModel } from '../model/character-details';
import { CharacterSpreadsheets, SpreadsheetKeys } from '../model/spreadsheet-keys';
import { applyFrontSheetToCharacter } from './spreadsheet-to-character-details-mapper';
import {applyBackSheetToCharacter} from './spreadsheet-to-character-details-mapper';

/**
 * Fetches the data from google spreadsheets
 * https://docs.google.com/spreadsheets/d/1i-i4lnApPVyM84Puxb8h7JjodZqHGasAWiN1u2Lxs5g/edit#gid=0
 * The URL to get the JSON from a google spreasheet is:
 * https://spreadsheets.google.com/feeds/list/{{key}}/{{worksheetID}}/public/values?alt=json
 * You can find the key when publishing the spreadsheet, but fo the worksheet ID go to
 * https://spreadsheets.google.com/feeds/worksheets/{{key}}/private/full
 * And search for the link
 */

const BASE_URL : string = 'https://spreadsheets.google.com/feeds';
const LIST : string = 'list';
const CELLS : string = 'cells';
const SPREADSHEET_KEY : string = '1i-i4lnApPVyM84Puxb8h7JjodZqHGasAWiN1u2Lxs5g';
const CHARACTER_WORKSHEET_ID : string = 'od6';
const ITEM_WORKSHEET_ID : string = 'ogun2ej';
const ACHIEVEMENT_WORKSHEET_ID : string = 'orwrc8q';
const OPTIONS : string = 'public/values?alt=json';

const EMPTY_MODEL : CharacterDetailsModel = {
    // General stuff
    name: '',
    role: '',
    about: '',
    story: '',
    experienceEarned: 0,

    // Characteristics
    weaponSkill: 0,
    ballisticSkill: 0,
    strength: 0,
    toughness: 0,
    agility: 0,
    intelligence: 0,
    perception: 0,
    willpower: 0,
    fellowship: 0,
    influence: 0,

    talents: [],
    skills: null,
    items: []
};

@Injectable()
export class CharacterConnectorGoogleSpreadsheet {

    characters : Observable<CharacterSpreadsheets>;

    constructor (private http : Http) {}

    /**
     * Gets the all the CharacterModels and also internally saves the spreadsheet keys
     * @returns {Observable<R>}
     */
    getCharacters () : Observable<CharacterModel[]> {

        let baseCall : Observable<any> =
            this.http.get(`${BASE_URL}/${LIST}/${SPREADSHEET_KEY}/${CHARACTER_WORKSHEET_ID}/${OPTIONS}`);

        // Get the spreasheet keys
        this.characters = baseCall
            .map(response => response.json().feed.entry).map((response : any[]) => {

                let result : CharacterSpreadsheets = {};
                response.forEach((row : any) => {
                    // Save all the keys
                    let entry : SpreadsheetKeys = {
                        spreadsheetKey: row.gsx$key.$t,
                        frontWorksheetKey: row.gsx$front.$t,
                        backWorksheetKey: row.gsx$back.$t,
                    };
                    result[JSON.parse(row.gsx$id.$t)] = entry
                });

                return result;
            });

        // Return the CharacterModels
        return baseCall.map(response => response.json().feed.entry).map((response : any[]) => {

            let result : CharacterModel[] = [];
            response.forEach((row : any) => {
                // Actual CharacterModel
                let char : CharacterModel = {
                    id: JSON.parse(row.gsx$id.$t),
                    name: row.gsx$name.$t,
                    image: row.gsx$image.$t,
                    achievements: this.parseStringToNumberArray(row.gsx$achievements.$t),
                };
                result.push(char);
            });

            return result;
        });
    }

    /**
     * Returns all the Character details from the spreadsheet for the given ID
     * If no spreadsheet is given, it will return empty data
     */
    getCharacterDetails (id : number) : Observable<CharacterDetailsModel> {
        return this.characters.map((sheets : CharacterSpreadsheets) => {

            let keys : SpreadsheetKeys = sheets[id];
            let character : CharacterDetailsModel = EMPTY_MODEL;
            if (!keys) {
                return character;
            }

            let front : Observable<any> =
                this.http.get(`${BASE_URL}/${CELLS}/${keys.spreadsheetKey}/${keys.frontWorksheetKey}/${OPTIONS}`)
                    .map(response => response.json()).map((response : any[]) => {
                    applyFrontSheetToCharacter(response, character);
                });

            let back : Observable<any> =
                this.http.get(`${BASE_URL}/${CELLS}/${keys.spreadsheetKey}/${keys.backWorksheetKey}/${OPTIONS}`)
                    .map(response => response.json()).map((response : any[]) => {
                    applyBackSheetToCharacter(response, character);
                });

            // When front & back is done, return the model
            return Observable.combineLatest([front, back], (front : any, back : any) => {
                return character;
            });
        })
    }

    /**
     * Returns all achievements from the Google Spreadsheet
     * @returns {Observable<R>}
     */
    getAchievements () : Observable<AchievementModel[]> {
        return this.http.get(`${BASE_URL}/${LIST}/${SPREADSHEET_KEY}/${ACHIEVEMENT_WORKSHEET_ID}/${OPTIONS}`)
            .map(response => response.json().feed.entry)
            .map((response : any[]) => {
                let result : AchievementModel[] = [];
                response.forEach((row : any) => {
                    let achievement : AchievementModel = {
                        id: JSON.parse(row.gsx$id.$t),
                        description: row.gsx$description.$t,
                        image: row.gsx$image.$t,
                        name: row.gsx$name.$t,
                        date: new Date(row.gsx$date.$t),
                        rarity: JSON.parse(row.gsx$rarity.$t)
                    };
                    result.push(achievement);
                });
                return result;
            });
    }

    parseStringToNumberArray (string : String) : number[] {
        let stringArray : string[] = string.split(',');
        let numberArray : number[] = [];
        try {
            stringArray.forEach((entry : String) => {
                if (!isNaN(+entry)) {
                    numberArray.push(+entry);
                }
            });
        } finally {
            return numberArray;
        }
    }
}
