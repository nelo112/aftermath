//declare const WEAPON : string = 'WEAPON';
//declare const ARMOR : string = 'ARMOR';
//declare const TRINKET : string = 'TRINKET';

import './sortable.d.ts';

declare interface ItemModel extends Sortable {
    id : number;
    type : string;
    description : string;
    image : string;
}
