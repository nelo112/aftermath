// Serivces
import { Component, Input, AfterViewInit, OnChanges, Inject, NgZone, ElementRef }
    from 'angular2/core';
import { ResponsivenessService } from '../../service/responsiveness-service';

// Sub Components
import { NgIf } from 'angular2/common';
import { SortableBox } from './sortable-box/sortable-box';
import { Icon } from '../icon/icon';

// Style
import './sortable-boxes.less';
import {AchievementModel} from '../../model/achievement';
import {VIEWMODE} from '../../service/responsiveness-service';

enum SORT {
    NAME,
    DATE,
    RARITY
}

@Component({
    selector: 'sortable-boxes',
    template: require('./sortable-boxes.html'),
    directives: [Icon, NgIf]
})
/**
 * A horizontal menu, to be filled with horizontal menu entries
 * Subentries are possible, but so far only 1 sublevel is actually styled.
 * Sticks to the top of the screen when scrolling down
 */
export class SortableBoxes implements AfterViewInit, OnChanges {

    @Input('sortables') sortablesInput : Sortable[];

    a : AchievementModel;
    htmlEntries : HTMLElement[];

    coloumnCount : number = 4;

    // In pixel
    boxHeight : number;

    scrollableDiv : HTMLElement;
    contentDiv : HTMLElement;

    showScroll : boolean;
    atTop : boolean = true;
    atBottom : boolean = false;

    // When sorting by name/date/rarity the first sort should always be in ascending order but the next in descending
    // So we need to remember by what criteria we sorted last and if the last sort was a ascending or descending sort
    reverseSort : number = 1;
    lastSort : number = -1;

    constructor (@Inject(NgZone) private zone : NgZone, @Inject(ElementRef) element : ElementRef,
                 @Inject(ResponsivenessService) private responsivenessService : ResponsivenessService) {

        responsivenessService.onChange(() => {
            this.initiateView();
        });

        // Cross Browser mouse scrolling
        element.nativeElement.addEventListener('mousewheel', this.mouseWheelHandler.bind(this));
        element.nativeElement.addEventListener('DOMMouseScroll', this.mouseWheelHandler.bind(this));

        // Scroll check
        window.addEventListener('resize', () => {
            zone.run(() => {
                this.shouldWeScroll();
            });
        });

    }

    ngAfterViewInit () : any {
        this.initiateView();
    }

    ngOnChanges (changes : {}) : any {
        this.initiateView();
    }

    /**
     * The percentage width of a single box
     * @returns {number}
     */
    get boxWidth () : number {
        return 100 / this.coloumnCount;
    }

    /**
     * Unfortunately the sortable boxes take a bit to be drawn, so we have to poll until it's done
     * This is a really hacky solution but I couldn't come up with a better solution...
     */
    initiateView () : void {
        setTimeout(() => {
            if (this.updateHtmlVariables()) {
                this.positionBoxes(true);
            } else {
                this.initiateView();
            }
        }, 100);
    }

    /**
     * Updates the column count
     * Updates the references to HTML elements & variables (like box height)
     * Sets the height of scrollable div
     * Sets the width of entries
     * @returns {boolean} false if the view has not been initiated yet (and there are still HTML elements missing)
     */
    updateHtmlVariables () : boolean {

        // Update column count according to view model
        this.coloumnCount = this.responsivenessService.currentMode === VIEWMODE.MOBILE ? 2 :
            this.responsivenessService.currentMode === VIEWMODE.TABLET ? 3 : 4;

        // Update references to HTML entries
        let entriesList : NodeListOf<Element> = document.getElementsByClassName('sortable-box');
        if (!entriesList.length) {
            return false;
        }
        this.htmlEntries = [];
        for (let i : number = 0; i < entriesList.length; i++) {
            this.htmlEntries.push(<HTMLElement>entriesList.item(i));
            this.htmlEntries[i].style.width = this.boxWidth + '%';
        }

        // Update references to container divs
        this.scrollableDiv = document.getElementById('sortable-boxes-scrollable');
        this.contentDiv = document.getElementById('sortable-boxes-content');

        // Dynamically get the height (this way the code is a bit independent from the styling)
        this.boxHeight = this.htmlEntries[0].offsetHeight;

        // Since all cards are positon absolute we need to manually set the height of the scrollable div
        this.scrollableDiv.style.height =
            Math.ceil(this.htmlEntries.length / this.coloumnCount) * this.boxHeight + 'px';

        // That's the only way I got the initial scrolling check to work...
        setTimeout(() => {
            this.showScroll =
                Math.ceil(this.htmlEntries.length / this.coloumnCount) * this.boxHeight > this.contentDiv.clientHeight;
        }, 0);

        return true;
    }

    positionBoxes (firstTime : boolean = false) : void {
        // Move the div to the top
        this.scrollableDiv.style.top = '0';
        this.atTop = true;
        this.atBottom = false;

        // Position boxes
        this.htmlEntries.forEach((element : HTMLElement, index : number) => {

            // If this is the first time, the boxes start at the top left and get "dealt" to their position
            if (firstTime) {
                element.style.left = '0';
                element.style.top = '0';
            }

            // Timeout needed so the initial animation is played
            setTimeout(() => {
                element.style.left = (index % this.coloumnCount) * this.boxWidth + '%';
                element.style.top = Math.floor(index / this.coloumnCount) * this.boxHeight + 'px';
            }, 0);
        });
    }

    sortByName () : void {
        this.reverseSort = (this.lastSort === SORT.NAME) ? -this.reverseSort : 1;
        this.lastSort = SORT.NAME;
        this.htmlEntries.sort(this.getSortingFunction('name', this.reverseSort));
        this.positionBoxes();
    }

    sortByDate () : void {
        this.reverseSort = (this.lastSort === SORT.DATE) ? -this.reverseSort : 1;
        this.lastSort = SORT.DATE;
        this.htmlEntries.sort((a : HTMLElement, b : HTMLElement) => {
            if (new Date(a.getAttribute('data-date')) < new Date(b.getAttribute('data-date'))) {
                return -this.reverseSort;
            } else if (new Date(a.getAttribute('data-date')) > new Date(b.getAttribute('data-date'))) {
                return this.reverseSort;
            } else {
                return 0;
            }
        })
        ;
        this.positionBoxes();
    }

    sortByRarity () : void {
        this.reverseSort = (this.lastSort === SORT.RARITY) ? -this.reverseSort : 1;
        this.lastSort = SORT.RARITY;
        this.htmlEntries.sort(this.getSortingFunction('rarity', -this.reverseSort));
        this.positionBoxes();
    }

    /**
     * Returns a sorting function for HTML Elements
     * @param attribute The attribute which should be used for simple "<" and ">" comparisons
     * @param reverseSort
     * @returns {function(HTMLElement, HTMLElement): (number|number|number)}
     */
    getSortingFunction (attribute : string, reverseSort : number) : (a : HTMLElement, b : HTMLElement) => number {
        return (a : HTMLElement, b : HTMLElement) => {
            if (a.getAttribute('data-' + attribute) < b.getAttribute('data-' + attribute)) {
                return -reverseSort;
            } else if (a.getAttribute('data-' + attribute) > b.getAttribute('data-' + attribute)) {
                return reverseSort;
            } else {
                return 0;
            }
        };
    }

    /**
     * Moves the scrollable div up, so the entries further down are visible
     * Returns false if we are already at the bottom, true if we actually scrolled
     */
    scrollDown () : boolean {

        this.atTop = false;
        let minimumValue : number = this.contentDiv.offsetHeight - this.scrollableDiv.scrollHeight;

        // Already at the bottom or scrollable div is small than the content box
        if (this.scrollableDiv.offsetTop === minimumValue ||
            this.scrollableDiv.scrollHeight < this.contentDiv.clientHeight) {
            this.atBottom = true;
            return false;
        }

        let potentialNewTopValue : number =
            parseInt(window.getComputedStyle(this.scrollableDiv).top.replace(/px/, ''), 10) - this.boxHeight / 2;

        if (potentialNewTopValue > minimumValue) {
            this.scrollableDiv.style.top = potentialNewTopValue + 'px';
        } else {
            this.atBottom = true;
            this.scrollableDiv.style.top = minimumValue + 'px';
        }
        return true;

    }

    /**
     * Moves the scrollable div down, so the entries further up are visible
     * Returns false if we are already at the top, true if we actually scrolled
     */
    scrollUp () : boolean {

        this.atBottom = false;
        // Already at the top or scrollable div is small than the content box
        if (this.scrollableDiv.offsetTop === 0 || this.scrollableDiv.scrollHeight < this.contentDiv.clientHeight) {
            this.atTop = true;
            return false;
        }

        let potentialNewTopValue : number =
            parseInt(window.getComputedStyle(this.scrollableDiv).top.replace(/px/, ''), 10) + this.boxHeight / 2;

        if (potentialNewTopValue < 0) {
            this.scrollableDiv.style.top = potentialNewTopValue + 'px';
        } else {
            this.atTop = true;
            this.scrollableDiv.style.top = '0';
        }
        return true;
    }

    /**
     * Scrolls the sortable box according to the mouse wheel & prevents the scrolling event from bubbling
     * if the box is scrolling.
     */
    private mouseWheelHandler (event : WheelEvent) : void {
        if (!this.showScroll) {
            return;
        }
        // Scroll up, if the event was a scroll-up and prevent event bubbling if we scrolled successfully
        if (event.deltaY < 0) {
            if (this.scrollUp()) {
                event.preventDefault();
            }
            // Scroll down otherwise and prevent event bubbling if we scrolled successfully
        } else if (this.scrollDown()) {
            event.preventDefault();
        }
    }

    private shouldWeScroll () : void {
        this.showScroll = this.scrollableDiv.scrollHeight > this.contentDiv.clientHeight;
        if (!this.showScroll) {
            this.scrollableDiv.style.top = '0';
        }
    }
}
