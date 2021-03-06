import {getDate, getNumber, spreadsheetJsonToArray} from './spreadsheet-mapper-helper';

const NO_TALENT_NAME : string = 'None';

export function applyFrontSheetToCharacter (json : any, character : CharacterDetails) : void {
    let sheet : string[][] = spreadsheetJsonToArray(json);

    // General stuff left side (on the character sheet)
    character.name = sheet[6][8];
    character.homeWorld = sheet[7][8];
    character.background = sheet[8][8];
    character.role = sheet[9][8];
    character.eliteAdvances = sheet[10][8];
    character.divination = sheet[11][8];
    character.about = sheet[12][4];

    // General stuff right side (on the character sheet)
    character.gender = sheet[7][26];
    character.age = sheet[7][30];
    character.build = sheet[7][35];
    character.complexion = sheet[8][26];
    character.quirks = sheet[9][26];
    character.superstition = sheet[10][26];
    character.momentos = sheet[11][26];
    character.allies = sheet[12][26];
    character.enemies = sheet[13][26];

    applyCharacteristics(sheet, character);

    applyAptitudes(sheet, character);

    // Bad stuff
    character.insanity = getNumber(sheet[40][16]);
    character.mentalDisorders = getStringArrayFromSpreadsheet(sheet, 42, 10, 3);
    character.corruption = getNumber(sheet[46][16]);
    character.malignancies = getStringArrayFromSpreadsheet(sheet, 48, 10, 3);
    character.mutations = getStringArrayFromSpreadsheet(sheet, 48, 19, 3);

    // XP
    character.experienceEarned = JSON.parse(sheet[32][17]);
    character.characteristicExperience = JSON.parse(sheet[33][17]);
    character.skillExperience = JSON.parse(sheet[34][17]);
    character.talentExperience = JSON.parse(sheet[35][17]);
    character.psykerExperience = JSON.parse(sheet[36][17]);
    character.experienceAvailable = JSON.parse(sheet[38][17]);

    character.homeworldBonus = sheet[48][30];
    character.backgroundBonus = sheet[49][30];
    character.roleBonus = sheet[50][30];

    applyTalents(sheet, character);

    applySkill(sheet, character);

    character.story = sheet[73][2];

}

export function applyCharacterDetailsSheetToCharacter (json : any, character : CharacterDetails) : void {
    let sheet : string[][] = spreadsheetJsonToArray(json);

    applySins(sheet, character);

    // Apply personality
    character.personality = getQuestionAndAnswers(13, sheet, character);
    // Apply the NPC relations
    character.relationships = getQuestionAndAnswers(29, sheet, character);
}

export function applyBackSheetToCharacter (json : any, character : CharacterDetails) : void {
    let sheet : string[][] = spreadsheetJsonToArray(json);

    character.fatePoints = getNumber(sheet[36][16]);
    character.wounds = getNumber(sheet[8][46]);

    applyItems(sheet, character);
}

function applyCharacteristics (sheet : string[][], character : CharacterDetails) : void {
    character.characteristics.weaponSkill = JSON.parse(sheet[19][9]);
    character.characteristics.ballisticSkill = JSON.parse(sheet[21][9]);
    character.characteristics.strength = JSON.parse(sheet[23][9]);
    character.characteristics.toughness = JSON.parse(sheet[25][9]);
    character.characteristics.agility = JSON.parse(sheet[27][9]);
    character.characteristics.intelligence = JSON.parse(sheet[19][19]);
    character.characteristics.perception = JSON.parse(sheet[21][19]);
    character.characteristics.willpower = JSON.parse(sheet[23][19]);
    character.characteristics.fellowship = JSON.parse(sheet[25][19]);
    character.characteristics.influence = JSON.parse(sheet[27][19]);
}

/**
 * If the number for the Aptitude is not 0 it will be added to the aptitude string array
 * @param sheet
 * @param character
 */
function applyAptitudes (sheet : string[][], character : CharacterDetails) : void {
    for (let row : number = 32; row <= 50; row++) {
        if (JSON.parse(sheet[row][8]) > 0) {
            character.aptitudes.push(sheet[row][4]);
        }
    }
}

function applyTalents (sheet : string[][], character : CharacterDetails) : void {
    for (let row : number = 55; row < 70; row++) {
        let talentName : string = sheet[row][2];
        if (talentName !== NO_TALENT_NAME) {
            character.talents.push({
                name: talentName,
                description: sheet[row][10],
                comment: sheet[row][34]
            });
        }
    }
}

function applySkill (sheet : string[][], character : CharacterDetails) : void {
    // Left skill column
    applySkillColumn(22, 29, sheet, character);
    // Right skill column
    applySkillColumn(35, 44, sheet, character);
}

/**
 * Checks the skills, save the name, the highest rank and the total bonus
 * Since the left & right column are a bit different in the spreadsheet we need to give all kinds of parameters
 * @param colOfName The column where the name of the rank starts
 * @param colOfRankOne The column in wich rank 1 ("known") is
 * @param sheet
 * @param character
 */
function applySkillColumn (colOfName : number,
                           colOfRankOne : number,
                           sheet : string[][],
                           character : CharacterDetails) : void {
    for (let row : number = 19; row <= 45; row++) {
        if (!!sheet[row][colOfRankOne]) {
            let skill : Skill = {
                name: sheet[row][colOfName],
                rank: !!sheet[row][colOfRankOne + 3] ? 4 :
                    !!sheet[row][colOfRankOne + 2] ? 3 :
                        !!sheet[row][colOfRankOne + 1] ? 2 : 1,
                total: JSON.parse(sheet[row][colOfRankOne + 4])
            };
            character.skills.push(skill);
        }
    }
}

/**
 * Adds the content of non-empty cells for the given row/col and adds it to the string array
 * @param sheet
 * @param row Starting row
 * @param col Column
 * @param rowCount Number of rows (going down from start)
 * @param strings Array to which cell content should be added
 */
function getStringArrayFromSpreadsheet (sheet : string[][],
                                        row : number,
                                        col : number,
                                        rowCount : number) : string[] {
    let strings : string[] = [];
    for (let currentRow : number = row; currentRow < row + rowCount; currentRow++) {
        if (!!sheet[currentRow][col]) {
            strings.push(sheet[currentRow][col]);
        }
    }
    return strings;
}

function applyItems (sheet : string[][], character : CharacterDetails) : void {

    for (let row : number = 43; row <= 64; row++) {

        let itemName : string = sheet[row][2];

        if (!!itemName) {

            character.items.push({
                name: itemName,
                description: sheet[row][6],
                type: sheet[row][15],
                date: getDate(sheet[row][17]),
                image: sheet[row][19],
                rarity: getNumber(sheet[row][20])
            });
        }
    }
}

function applySins (sheet : string[][], character : CharacterDetails) : void {
    character.sins.gluttony = getSinLevel(4, sheet);
    character.sins.greed = getSinLevel(5, sheet);
    character.sins.sloth = getSinLevel(6, sheet);
    character.sins.envy = getSinLevel(7, sheet);
    character.sins.wrath = getSinLevel(8, sheet);
    character.sins.pride = getSinLevel(9, sheet);
    character.sins.lust = getSinLevel(10, sheet);
}

function getSinLevel (row : number, sheet : string[][]) : number {
    return !!sheet[row][9] ? 5 :
        !!sheet[row][8] ? 4 :
            !!sheet[row][7] ? 3 :
                !!sheet[row][6] ? 2 : 1;

}

function getQuestionAndAnswers (row : number, sheet : string[][], character : CharacterDetails) : QuestionAnswer[] {
    let col : number = 2;

    let questionsAndAnswers : QuestionAnswer[] = [];

    while (!!sheet[row][col]) {

        questionsAndAnswers.push({
            question: sheet[row][col],
            answer: sheet[row + 1][col]
        });

        row += 3;
    }

    return questionsAndAnswers;
}
