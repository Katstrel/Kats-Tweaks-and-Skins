// ==UserScript==
// @name         [AO3] Kat's Tweaks
// @author       Katstrel
// @description  A suite of AO3 enhancements and tweaks.
// @version      0.2.0
// @namespace    https://github.com/Katstrel/Kats-Tweaks-and-Skins
// @include      https://archiveofourown.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=archiveofourown.org
// @grant        none
// @updateURL    https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/KatsTweaks.user.js
// @downloadURL  https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/KatsTweaks.user.js
// ==/UserScript==
"use strict";


// ─── Settings ────────────────────────────────────────────────────────────────

/*
    Ideally you will use the GUI provided on the navigation bar on AO3
    itself to control the settings, however, you have free will. 

    Below are the configured settings by default. Change them as you see fit.
    IF YOU DARE. As a reminder, modifying a userscript usually disables auto 
    updates. Just don't remove any unless you really know what you're doing...

    When saved settings do not exist or contain an error, the default is the
    fallback option. Most functions expect these values to exist.

    Sometimes settings will exist here before being added to the GUI due to
    testing or simply the amount of work it can take to add a new type of
    setting to the menu. BE PATIENT :D
*/

let LOADED_SETTINGS = {};
const DEFAULT_SETTINGS = {
    enabled: true,
    timeout: 1000,

    // ─────────────────────────────────────────────────────────────────────

    
    Tracking: {
        enabled: true,
        defaultNote: "No Notes",

        newBookmarksPrivate: true,
        newBookmarksRec: false,
        showUpdatedBookmarks: true,
        showAutoBookmarks: true,

        bookmarkComments: true,
        bookmarkKudos: true,
        bookmarkMarkedLater: true,
        bookmarkSubscribe: true,
        
        // Date format within the generated bookmark note.
        /*   Valid values: 'Month/Year', 'Day/Month/Year', 'Month/Day/Year',
            'Worded Month/Year', 'Worded Day/Month/Year', 'Worded Month/Day/Year',
            'Exact Day/Month/Year', 'Exact Month/Day/Year', 
            'Exact Worded Day/Month/Year', and 'Exact Worded Month/Day/Year' */
        dateFormat: "Month/Year",

        wordcounts: [
            {
                tag: 'Short Story | Under 10k',
                minimum: 0,
                maximum: 10000,
            },
            {
                tag: 'Novella | 10k to 50k',
                minimum: 10000,
                maximum: 50000,
            },
            {
                tag: 'Novel | 50k to 100k',
                minimum: 50000,
                maximum: 100000,
            },
            {
                tag: 'Longfic | Over 100k',
                minimum: 100000,
                maximum: Infinity,
            }
        ]

    },

    // ─────────────────────────────────────────────────────────────────────

    
    ReadTime: {
        enabled: true,
        wordsPerMinute: 200,
        color: true,

        // Time format within the stat block.
        /*   Valid values: 'Minutes', 'Hours Minutes', 'Days Hours Minutes',
            'Hours Float', and 'Days Float' */
        timeFormat: 'Days Hours Minutes',        

        // Controls the coloring of read times
        colorSettings: [
            {
                // ID must contain no spaces
                functionID: "Default",
                // name is unimportant except when using the setting GUI
                settingName: "Default",
                // color applies when the read time is over this value in minutes
                minutesThreshold: 0,
                // color is in RGBA format
                color: '#80ff8080',
            },
            {
                functionID: "Option1",
                settingName: "1 Hour",
                minutesThreshold: 60,
                color: '#ffff8080',
            },
            {
                functionID: "Option2",
                settingName: "3 Hours",
                minutesThreshold: 180,
                color: '#ff808080',
            },
            {
                functionID: "Option3",
                settingName: "12 Hours",
                minutesThreshold: 720,
                color: '#ff80ff80',
            },
            {
                functionID: "Option4",
                settingName: "24 Hours",
                minutesThreshold: 1440,
                color: '#8080ff80',
            },
        ],
    },
};



// ─── Global Variables And Introduction ───────────────────────────────────────

/*
    Object Orientated Programming my beloved~

    So you scrolled further?! Welcome to the insanity!

    There is a method to the madness. You'll find the module classes first, then
    you can find the other classes sorted by alphabetical order after that. The
    first one is DataCollector. At the very bottom is the Main class that actually 
    starts running the script! 

    TODO:
    Update the DataCollector published and updated times. BE DATE NOT STRING
    Add kudos list check clicks using - document.getElementById("btnHandler").click();
     - btnHandler needs to be the kudos button tag
    Rewrite modules and add them, remember to break up Bookmarking
    Rewrite the settings module to open the gui on click instead of dropdown

    Add function to update username due to settings saved based on user
    When rewriting bookmark tag cache, use ${KEYCHAIN}-${USERNAME}-${MODULE}

    -+=O=+-
*/

const LOGNAME = `[Kat's Tweaks]`; // Log prefix
const KEYCHAIN = `KATS`; // Localstorage prefix
const ELEMENTID = `KTweak`; // HTML Element ID
const DEBUG = true; // MOAR LOGS
const REVERSI = window.getComputedStyle(document.body).backgroundColor === 'rgb(51, 51, 51)';

// Captures the username or uses NA as a guest
const USERNAME = document.querySelector('ul.menu.dropdown-menu')?.previousElementSibling?.getAttribute('href')?.split('/').pop() ?? 'NA';



// ─── Tracking Module ─────────────────────────────────────────────────────────

/*
    This is the largest module as it does plenty of different functions.

    Several features are included:
    - Auto populate the bookmark form

    TODO:
    Update Last Read Button - run create notes
    Update Summary Button - change between dividers
    Wordcount tags
    Check old kudos

*/

class Tracking {
    constructor(pageType, blurb) {
        DEBUG && console.info(`${LOGNAME} Initilizing Tracking with page type: ${pageType}`)
        this.request = new ManageRequest();
        this.storage = new ManageStorage();
        this.collect = new DataCollector();
        this.settings = LOADED_SETTINGS.Tracking;
        this.keychain = `${KEYCHAIN}-${USERNAME}-Track`;
        this.elementID = `${KEYCHAIN}-Track`

        this.pageType = pageType;
        this.blurb = blurb;

        // ─── Constants ───────────────────────────────────────────────
        
        this.storage.arrayInit(`${this.keychain}-Bookmarked`);
        this.storage.arrayInit(`${this.keychain}-Checked`);
        this.storage.arrayInit(`${this.keychain}-Commented`);
        this.storage.arrayInit(`${this.keychain}-Kudosed`);
        this.storage.arrayInit(`${this.keychain}-MarkedLater`);
        this.storage.arrayInit(`${this.keychain}-Subscribed`);
        
        this.separator = "\nতততততততততত"
        this.header = "── Kat's Tracking ──────";
        this.divider = "\n── Summary ─────\n";
        
        this.workID = this.collect.getID(this.pageType, this.blurb);

        ManageStyle.addStyle('Bookmarked', `.${this.elementID}-Bookmarked { border-right: 50px solid ${REVERSI ? '#555' : '#ddd'} !important; } @media screen and (max-width: 62em) { .${this.elementID}-Bookmarked { border-right: 20px solid ${REVERSI ? '#555' : '#ddd'} !important;  }`);
        ManageStyle.addStyle('Checked', `.${this.elementID}-Checked { border-left: 5px solid ${REVERSI ? '#5998d6' : '#900'} !important; }`);

        // ─── Blurb Lists ─────────────────────────────────────────────


        
        if (this.pageType === 'LIST') {
            DEBUG && console.info(`${LOGNAME} Blurb for work ${this.workID} found in list!`)
            this.editButton = this.blurb.querySelector(`#bookmark_form_trigger_for_${this.workID}`);

            this.listCheckStatus(this.workID);

            // Edit Button & Bookmark Form
            if (this.editButton) { this.listEditForm(); }
        }


        // ─── Initialize Series And Works ─────────────────────────────



        switch(this.pageType) {
            default:
                return;
            case 'SERIES':
                this.isSeries = true;
            case 'WORK':
        }

        this.elementNotes = document.getElementById('bookmark_notes');
        this.elementTags = document.getElementById('bookmark_tag_string_autocomplete');

        this.bookmarkID = this.collect.getBookmarkID(this.pageType);
        this.storageID = this.isSeries ? `S${this.workID}` : this.workID; // Prefix series with S
        this.notes = this.collect.getBookmarkNotes(this.pageType);
        this.tags = this.collect.getBookmarkTagsAndCollections(this.pageType, 1);
        this.private = this.collect.getBookmarkPrivate(this.pageType);
        this.reccomend = this.collect.getBookmarkRecommend(this.pageType);

        this.userNotes = this.collect.getBookmarkUserNotes(this.pageType, this.separator, this.settings.defaultNote);
        this.generatedNotes = this.createNotes(this.userNotes);
        
        DEBUG && console.log(`${LOGNAME} Initialized Tracking module with data:`);
        DEBUG && console.table({
            storageID: this.storageID,
            workID: this.collect.getID(this.pageType, this.blurb),
            bookmarkID: this.collect.getBookmarkID(this.pageType),
            pseudID: this.collect.getPseudID(this.pageType),
            notes: this.notes,
            tags: this.tags,
            collections: this.collect.getBookmarkTagsAndCollections(this.pageType, 2),
            isPrivate: this.private,
            isRec: this.reccomend,

            usernote: this.userNotes,
            genNote: this.generatedNotes,
        });
        
        // ─── Series And Works Functions ──────────────────────────────
        
        this.statusBookmarked();
        this.statusTags();

        // If no notes exist, populate the note. Else, provide update buttons
        if (!this.notes.includes(this.separator)) {
            DEBUG && console.log(`${LOGNAME} No existing bookmark tracking found.`)
            this.elementNotes.innerHTML = this.generatedNotes;
            this.notes = this.generatedNotes;
        } else {
            this.updateLastRead(document, '#bookmark_notes');
            if (this.collect.getSummary(this.pageType, this.blurb)) {
                this.updateSummary(document, '#bookmark_notes');
            }
        }

        // If status is detected, populate and/or create the bookmark
        this.statusCommented('Commented');
        this.statusKudosed('Kudosed');
        this.statusMarkLater('To Read');
        this.statusSubscribed('Subscribed');
    }
    

    // ─── List Functions ──────────────────────────────────────────────────

    

    listCheckStatus(storageID) {
        DEBUG && console.log(`${LOGNAME} Checking status of blurb ${storageID}`)
        let bookmarkBy = this.blurb.querySelector("h5.byline.heading a")?.innerText ?? "";
        
        if (bookmarkBy === USERNAME) {
            this.storage.arrayAdd(`${this.keychain}-Bookmarked`, storageID);
            this.blurb.classList.add(`${this.elementID}-Bookmarked`);
            return;
        }

        let isBookmarked = this.storage.arrayGet(`${this.keychain}-Bookmarked`).includes(storageID);
        let isChecked = this.storage.arrayGet(`${this.keychain}-Checked`).includes(storageID);
        if (!isBookmarked && !isChecked) {
            this.storage.arrayAdd(`${this.keychain}-Checked`, storageID);
            this.blurb.classList.add(`${this.elementID}-Checked`);
        } else if (isBookmarked) {
            this.storage.arrayRemove(`${this.keychain}-Checked`, storageID);
            this.blurb.classList.add(`${this.elementID}-Bookmarked`);
        }
    }

    listEditForm() {
        DEBUG && console.log(`${LOGNAME} Found bookmark Edit button for ${this.workID}`);

        this.editButton.addEventListener('click', async(event) => {
            event.preventDefault();
            let form = this.blurb.querySelector('#bookmark-form');
            while (!form) {
                DEBUG && console.log(`${LOGNAME} Waiting .25s`);
                await new Promise(res => setTimeout(res, 250));
                form = this.blurb.querySelector('#bookmark-form');
            }

            DEBUG && console.log(`${LOGNAME} Found bookmark form`);
            this.elementNotes = this.blurb.querySelector(`#bookmark_notes_${this.workID}`);
            this.elementTags = this.blurb.querySelector('#bookmark_tag_string_autocomplete');
            this.notes = this.collect.getBookmarkNotes(this.pageType, this.blurb);
            this.tags = this.collect.getBookmarkTagsAndCollections(this.pageType, 1, this.blurb);
            this.summary = this.collect.getSummary(this.pageType, this.blurb);
            
            DEBUG && console.log(`${LOGNAME} Initialized Tracking module with data:`);
            DEBUG && console.table({
                workID: this.collect.getID(this.pageType, this.blurb),
                notes: this.notes,
                tags: this.tags,
            });

            this.statusTags(this.blurb, this.collect.getWordCount(this.pageType, this.blurb));
            this.updateSummary(this.blurb, `#bookmark_notes_${this.workID}`);
        });
    }


    // ─── Check And Request Bookmark ──────────────────────────────────────


    
    // Adds to storage if page is bookmarked
    statusBookmarked() {
        if (this.workID !== this.bookmarkID) {
            DEBUG && console.log(`${LOGNAME} Bookmark already exists. WorkID: ${this.workID} | BookmarkID: ${this.bookmarkID}`);
    
            this.storage.arrayAdd(`${this.keychain}-Bookmarked`, this.storageID);
            this.storage.arrayRemove(`${this.keychain}-Checked`, this.storageID);            
            this.blurb.classList.add(`${this.elementID}-Bookmarked`);
        } else {
            DEBUG && console.log(`${LOGNAME} Not bookmarked! WorkID: ${this.workID} | BookmarkID: ${this.bookmarkID}`);
            
            // Are new bookmarks private and or reccommended? Controlled in settings
            this.private = this.settings.newBookmarksPrivate;
            this.reccomend = this.settings.newBookmarksRec;
            document.getElementById('bookmark_private').checked = this.private;
            document.getElementById('bookmark_rec').checked = this.reccomend;
        
            // Catches works where the bookmark was removed and removes the ID from cache
            this.storage.arrayRemove(`${this.keychain}-Bookmarked`, this.storageID);
            this.storage.arrayAdd(`${this.keychain}-Checked`, this.storageID);
        }
    }

    // If a comment is submitted: add to storage, add the tag, and request the bookmark
    statusCommented(tag) {
        if (document.querySelector(`div.flash.comment_notice`)?.innerText === "Comment created!") {
            this.statusHandler(true, tag, 'Commented', this.settings.bookmarkComments);
        }
    }

    // If a new kudos is submitted: add to storage, add the tag, and request the bookmark
    statusKudosed(tag) {
        document.querySelectorAll(`#kudo_submit`).forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                this.statusHandler(true, tag, 'Kudosed', this.settings.bookmarkKudos);
            });
        });
    }

    // If a new mark for later is submitted: add to storage, add the tag, and request the bookmark
    statusMarkLater(tag) {
        if (document.querySelector(`div.flash.notice`)?.innerText.includes("added")) {
            this.statusHandler(true, tag, 'MarkedLater', this.settings.bookmarkMarkedLater);
        } else if (document.querySelector(`div.flash.notice`)?.innerText.includes("removed")) {
            this.statusHandler(false, tag, 'MarkedLater', this.settings.bookmarkMarkedLater);
        }
    }

    // If a new subscription is submitted: add to storage, add the tag, and request the bookmark
    statusSubscribed(tag) {
        document.querySelectorAll(`li.subscribe input`).forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                if (button.value === "Subscribe") {
                    this.statusHandler(true, tag, 'Subscribed', this.settings.bookmarkSubscribe);
                } else {
                    this.statusHandler(false, tag, 'Subscribed', this.settings.bookmarkSubscribe);
                }
            });
        });
    }

    // Creates the tag and sends to the request handler
    async statusHandler(createNew, tag, key, auto) {
        if (createNew) {
            DEBUG && console.log(`${LOGNAME} Adding ${this.storageID} to ${this.keychain}-${key}`);
            this.storage.arrayAdd(`${this.keychain}-${key}`, this.storageID);
            this.addTag(tag);
        } else {
            DEBUG && console.log(`${LOGNAME} Removing ${this.storageID} from ${this.keychain}-${key}`);
            this.storage.arrayRemove(`${this.keychain}-${key}`, this.storageID);
            this.removeTag(tag);
        }

        if (auto) {
            await new Promise(res => setTimeout(res, 500));
            DEBUG && console.log(`${LOGNAME} Requesting bookmark automatically.`);
            DEBUG && console.table({
                storageID: this.storageID,
                workID: this.collect.getID(this.pageType, this.blurb),
                bookmarkID: this.collect.getBookmarkID(this.pageType),
                pseudID: this.collect.getPseudID(this.pageType),
                notes: this.notes,
                tags: this.tags,
                collections: this.collect.getBookmarkTagsAndCollections(this.pageType, 2),
                isPrivate: this.private,
                isRec: this.reccomend,
            });
            this.requestHandler(this.createBookmarkData(), this.workID, this.settings.showAutoBookmarks);
        }
    }

    // Compiles the information needed for requestHandler
    createBookmarkData() {
        return {
            workID: this.collect.getID(this.pageType, this.blurb),
            bookmarkID: this.collect.getBookmarkID(this.pageType),
            pseudID: this.collect.getPseudID(this.pageType),
            notes: this.notes,
            tags: this.tags,
            collections: this.collect.getBookmarkTagsAndCollections(this.pageType, 2),
            isPrivate: this.private,
            isRec: this.reccomend
        };
    }

    // Creates the request for the bookmark
    async requestHandler(bookmarkData, workID, forceBookmarkPage) {
        if (workID !== this.bookmarkID) {
            await this.request.bookmarkUpdate(this.bookmarkID, bookmarkData);
            if (forceBookmarkPage) {
                window.location.href = `https://archiveofourown.org/bookmarks/${this.bookmarkID}`;
            }
            DEBUG && console.log(`${LOGNAME} Updated bookmark ID: ${this.bookmarkID}`);
        }
        else {
            bookmarkData.isPrivate = this.settings.newBookmarksPrivate;
            bookmarkData.isRec = this.settings.newBookmarksRec;
            this.bookmarkID = await this.request.createBookmark(workID, bookmarkData);
            window.location.href = `https://archiveofourown.org/bookmarks/${this.bookmarkID}`;
            DEBUG && console.log(`${LOGNAME} Created bookmark ID: ${this.bookmarkID}`);
        }
    }


    // ─── Bookmark Tags And Notes ─────────────────────────────────────────

    

    // Add tags for completion and wordcount
    statusTags() {
        // Completion
        if (this.collect.getEstimatedChapters(this.pageType, this.blurb) === 1) {
            this.addTag("Oneshot");
        } 
        else if (this.collect.getComplete(this.pageType, this.blurb)) {
            this.addTag("Complete");
        }

        // Wordcounts
        this.settings.wordcounts.forEach(({tag, minimum, maximum}) => {
            if (minimum <= this.collect.getWordCount(this.pageType, this.blurb) && this.collect.getWordCount(this.pageType, this.blurb) < maximum) {
                this.addTag(tag)
            }
        });
    }
    
    // Add a tag to the form and meta
    addTag(tag) {
        DEBUG && console.log(`${LOGNAME} Adding tag: ${tag}`);
        this.elementTags.value += `${tag}, `;
        this.tags.push(tag);
    }

    // Remove a tag from the form and meta
    removeTag(tag) {
        DEBUG && console.log(`${LOGNAME} Removing tag: ${tag}`);
        if (this.tags.includes(tag)) {
            this.elementTags.value = `${this.elementTags.value.split(`${tag}, `)[0]}${this.elementTags.value.split(`${tag}, `)[1]}`;
            this.tags.splice(this.tags.indexOf(tag), 1);
        }
    }
    
    // Create new usernotes and returns the string
    createNotes(userNotes) {
        DEBUG && console.log(`${LOGNAME} Generating new bookmark notes.`)
        const notes = userNotes;

        // Creates the last read with a timestamp and either a link to the chapter or no link for Oneshot
        const last = this.isSeries ? '\nSERIES' : `\nLast Read: ${this.collect.convertTimeToFormat(this.collect.getCurrentTime(), this.settings.dateFormat)} ${this.collect.getCurrentChapter(this.pageType)?.href ? `(\<a href="${this.collect.getCurrentChapter(this.pageType).href}"\>${this.collect.getCurrentChapter(this.pageType).innerText}\</a\>)` : "(Oneshot)"}`;

        // Data Formation
        let authorList = '';
        this.collect.getAuthor(this.pageType, this.blurb)?.forEach(link => {
            authorList += `\<a href="${link.href}"\>${link.innerText}\</a\> `;
        });
        let seriesList = '';
        if (!this.isSeries) {
            this.collect.getSeries(this.pageType, this.blurb)?.forEach(link => {
                seriesList += `\<a href="${link.href}"\>${link.innerText}\</a\> `;
            });
        }
        
        // Tracking Block
        const track = `\n\<details\>\<summary\>${this.header}\</summary\>`;
        const author = `\nAuthor: ${authorList}`
        const series = this.isSeries ? '' : `\nSeries: ${seriesList}`
        const title = `\nTitle: \<a href="https://archiveofourown.org/${this.isSeries ? 'series' : 'works'}/${this.workID}"\>${this.collect.getTitle(this.pageType, this.blurb)}\</a\>`;

        const summary = this.collect.getBookmarkOldSummary(this.pageType, this.divider, 1);
        
        // Work vs Series notes
        if (this.isSeries) {
            return `${notes}${this.separator}${last}\n${track}${title}${author}\n${this.divider}${summary}${summary.includes(`</details>`) ? "" : `\</details\>`}`;
        } else {
            return `${notes}${this.separator}${last}\n${track}${title}${author}${series}\n${this.divider}${summary}${summary.includes(`</details>`) ? "" : `\</details\>`}`;
        }
    }


    // ─── Form Buttons ────────────────────────────────────────────────────
    


    updateLastRead(blurb, query) {
        const buttonID = `${this.elementID}-${this.workID}-savechapter`;

        if (!(this.pageType === 'WORK')) { return; }
        blurb.querySelector('#notes-field-description').after(Object.assign(document.createElement('input'), {
            type: 'button',
            id: buttonID,
            class: `${ELEMENTID}-formButton`,
            value: `🔖 Update Last Read`,
        }));

        document.querySelectorAll(`#${buttonID}`).forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                let notes = this.generatedNotes;
                DEBUG && console.log(`${LOGNAME} Updating Last Read.`, notes);
                blurb.querySelector(query).innerHTML = notes;
                button.value = `🎉 Last Read Updated!`;
            });
        });

        this.focusedNotes(this.elementNotes, buttonID);
    }
    
    updateSummary(blurb, notesBox) {
        const buttonID = `${this.elementID}-${this.workID}-summary`;
        if (this.workID === this.bookmarkID) { return; }

        // Places a button after (under) the bookmark notes
        blurb.querySelector(notesBox).after(Object.assign(document.createElement('input'), {
            type: 'button',
            id: buttonID,
            class: `${ELEMENTID}-formButton`,
            value: `🖋️ Update Summary`,
        }));

        // Add Click Listeners
        document.querySelectorAll(`#${buttonID}`).forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();

                const data = blurb.querySelector(notesBox).innerHTML.split(this.divider)[0];
                const summary = `${this.collect.getSummary(this.pageType, this.blurb).innerHTML}`;

                let notes = `${data}${this.divider}${summary}${summary.includes(`</details>`) ? "" : `\</details\>`}`;
                DEBUG && console.log(`${LOGNAME} Updating Summary.\n`, notes);
                blurb.querySelector(notesBox).innerHTML = notes;
                button.value = `🎉 Summary Updated!`;
            });
        });

        this.focusedNotes(this.elementNotes, buttonID);
    }

    // Removes the buttons when the form is clicked
    focusedNotes(element, buttonID) {
        [ "change", "keydown", "keyup", "mousedown", "mouseup" ].forEach(function(event) {
            element.addEventListener(event, function(e) {
                if (document.getElementById(buttonID)) {
                    document.getElementById(buttonID)?.remove();
                }
            });
        });
    }

}



// ─── Read Time Module ────────────────────────────────────────────────────────

/*
    
*/

class ReadTime {

    constructor() {
        DEBUG && console.info(`${LOGNAME} Initilizing Read Time module!`)
        this.collect = new DataCollector();
        this.settings = LOADED_SETTINGS.ReadTime;
        this.elementID = `${KEYCHAIN}-Read`;

        // Run on all blurbs
        document.querySelectorAll('li.work.blurb, li.bookmark.blurb, dl.work.meta, dl.series.meta, li.series.blurb').forEach(blurb=> {
            if (blurb.querySelector('p.message')) { return; }
            const workWord = this.collect.getWordCount('LIST', blurb);
            const workTime = workWord/this.settings.wordsPerMinute;
            const stat = this.addStat('Read Time:', this.calculateTime(workTime), 'workTime', this.getColor(workTime));
            blurb.querySelector('dl.stats dd.words').after(stat[0], stat[1]);
        });

        // If on a chapter work, include chapter word count and read time
        if (document.querySelector(`dl.work.meta dl.stats dd.chapters`)) {
            this.chapterWCTime();
        }
    }

    chapterWCTime() {
        let chapCount = this.collect.getChapterCount('WORK', document.querySelector('dl.work.meta.group'));
        if (window.location.pathname.toLowerCase().includes(`chapters`) && chapCount > 1) {
            const chapWord = this.collect.getChapterWordCount('WORK');
            const formatCount = new Intl.NumberFormat({ style: `decimal` }).format(chapWord);
            const statWC = this.addStat('Words in Chapter:', formatCount, 'chapterWords');
            document.querySelector('dl.stats dd.chapters').after(statWC[0], statWC[1]);
            
            const chapTime = chapWord/this.settings.wordsPerMinute;
            const stat = this.addStat('Read Time:', this.calculateTime(chapTime), 'chapterTime', this.getColor(chapTime));
            document.querySelector(`dl.stats dd.${ELEMENTID}-chapterWords`).after(stat[0], stat[1]);
        }
    }

    calculateTime(minutes, format = this.settings.timeFormat) {
        const days = Math.floor(minutes/1440);
        const hours = Math.floor(minutes/60);

        const dayFloat = (minutes/1440).toFixed(2);
        const hourFloat = (minutes/60).toFixed(2);

        const hourMins = (minutes%60).toFixed(0);
        const dayHours = ((minutes%1440)/60).toFixed(0)
        const dayMins = ((minutes%1440)%60).toFixed(0);

        switch(format) {
            case 'Minutes':
                return `${minutes}m`;
            case 'Hours Minutes':
                return `${hours > 0 ? `${hours}h` : ''}${hourMins > 0 ? `${hourMins}m` : ''}`;
            case 'Days Hours Minutes':
                return `${days > 0 ? `${days}d` : ''}${dayHours > 0 ? `${dayHours}h` : ''}${dayMins > 0 ? `${dayMins}m` : ''}`;
            case 'Hours Float':
                return `${hourFloat}h`;
            case 'Days Float':
                return `${hourFloat}h`;
        }
    }

    addStat(term, definition, classID, color) {
        let descListTerm = Object.assign(document.createElement(`dt`), {
            id: `${this.elementID}`,
            className: `${ELEMENTID}-${classID}`,
            textContent: term || "",
        });
        let descListDefine = Object.assign(document.createElement(`dd`), {
            id: `${this.elementID}`,
            className: `${ELEMENTID}-${classID}`,
            textContent: definition || ""
        });

        if (color) { descListDefine.style.backgroundColor = color; }

        return [descListTerm, descListDefine];
    }

    getColor(minutes) {
        let filteredOptions = this.settings.colorSettings.filter((option) => {
            return option.minutesThreshold <= minutes;
        });
        let sorted = filteredOptions.sort(function(a, b){return a.minutesThreshold - b.minutesThreshold});
        DEBUG && console.log(`[Kat's Tweaks] Sorted list`, sorted);

        return sorted[sorted.length-1].color;
    }
}



// ─── Tag Color Module ────────────────────────────────────────────────────────

/*
    
*/

class TagColor {
}



// ─── Collect Data From Ao3 Pages ─────────────────────────────────────────────

/*
    There are functions in here that are not used as a way to allow others to 
    easily modify the code to include the collected data, including my future 
    self...

    Page Types refers to the type of page like a work page, series page, or a
    page with any type of list on it. Series pages are also list pages, however,
    SERIES will target information in the series blurb while LIST will target
    a work blurb in the series list based on the blurb provided to the function.

    The blurb is the box wrapping around work information.
*/

class DataCollector {

    // Little function for switch case debugging
    defaultCatch(pageType, functionName) {
        if (!pageType) {
            DEBUG && console.error(`${LOGNAME} Page type not selected for data collection.`);
        } else {
            DEBUG && console.info(`${LOGNAME} Page type '${pageType}' not available for '${functionName}' data collection.`);
        }
    }

    // Returns the ID
    getID(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'ID');
                break;
            case 'LIST':
                return blurb.querySelector('h4.heading a').href.split('/').pop();
            case 'SERIES': // This is fall through, SERIES will run the same operation as WORK
            case 'WORK':
                return document.URL.split('/')[4].split('#')[0].split('?')[0];
        }
    }


    // ─── Basic Information ───────────────────────────────────────────────


    
    // Returns the title as a string
    getTitle(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Title');
                break;
            case 'LIST':
                return blurb.querySelector('h2.heading a').innerText;
            case 'SERIES':
                return document.querySelector('h2.heading').innerText;
            case 'WORK':
                return document.querySelector('div.preface.group h2.title.heading').innerText;
        }
    }

    // Returns the authors as an array of links
    getAuthor(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Author');
                break;
            case 'LIST': // This is fall through, LIST will run the same operation as SERIES
            case 'SERIES':
                return blurb.querySelectorAll('a[rel="author"]');
            case 'WORK':
                return document.querySelectorAll("div.preface.group h3.byline.heading a");
        }
    }

    // Returns the completion status as a boolean
    getComplete(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Complete');
                break;
            case 'LIST':
                return blurb.querySelector('span.iswip span.text').innerText === 'Complete Work' ? true : false;
            case 'SERIES':
                return blurb.querySelector('dl.stats').innerHTML.includes('<dd>Yes</dd>') ? true : false;
            case 'WORK':
                const estChapters = this.getEstimatedChapters(pageType, blurb);
                const numChapters = this.getChapterCount(pageType, blurb);
                return numChapters === estChapters ? true : false;
        }
    }

    // Returns the series as an array of links
    getSeries(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Series')
                break;
            case 'LIST':
                return blurb.querySelectorAll('ul.series a');
            case 'WORK':
                return blurb.querySelectorAll('dd.series span.position a');
        }
    }

    // Returns the date published as a date object
    getPublished(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Published');
                break;
            case 'SERIES':
                return blurb.querySelectorAll('dd')[1].innerText;
            case 'WORK':
                return blurb.querySelector('dd.published').innerText;
        }
    }

    // Returns the date last updated as a date object
    getUpdated(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Updated');
                break;
            case 'LIST':
                return blurb.querySelector('p.datetime').innerText;
            case 'SERIES':
                return blurb.querySelectorAll('dd')[2].innerText;
            case 'WORK':
                return blurb.querySelector('dd.status').innerText;
        }
    }


    // ─── Tag Information And Summary ─────────────────────────────────────



    // Returns the fandom tags as an array of links
    getFandom(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Fandom');
                break;
            case 'LIST':
                return blurb.querySelectorAll('h5 a.tag');
            case 'WORK':
                return blurb.querySelectorAll('dd.fandom a.tag');
        }
    }

    // Returns the rating as a string
    getRating(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Rating');
                break;
            case 'LIST':
                return blurb.querySelector('span.rating span.text').innerText;
            case 'WORK':
                return blurb.querySelector('dd.rating a.tag').innerText;
        }
    }

    // Returns the warning tags as an array of links
    getWarning(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Warning');
                break;
            case 'LIST':
                return blurb.querySelectorAll('span.warnings span.text');
            case 'WORK':
                return blurb.querySelectorAll('dd.warning a.tag');
        }
    }

    // Returns the marked category as an array
    getCategory(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Category');
                break;
            case 'LIST':
                return blurb.querySelectorAll('span.category span.text');
            case 'WORK':
                return blurb.querySelectorAll('dd.category a.tag');
        }
    }
    
    // Returns the relationship tags as an array of links
    getRelationships(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Relationships');
                break;
            case 'LIST':
                return blurb.querySelectorAll('li.relationships a.tag');
            case 'WORK':
                return blurb.querySelectorAll('dd.relationship a.tag');
        }
    }

    // Returns the character tags as an array of links
    getCharacters(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Characters');
                break;
            case 'LIST':
                return blurb.querySelectorAll('li.characters a.tag');
            case 'WORK':
                return blurb.querySelectorAll('dd.character a.tag');
        }
    }

    // Returns the freeform tags as an array of links
    getFreeform(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Freeform Tags');
                break;
            case 'LIST':
                return blurb.querySelectorAll('li.freeforms a.tag');
            case 'WORK':
                return blurb.querySelectorAll('dd.freeform a.tag');
        }
    }

    // Returns the summary as a string
    getSummary(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Summary');
                break;
            case 'LIST':
                return blurb.querySelector('blockquote.userstuff.summary');
            case 'SERIES':
                return blurb.querySelector('blockquote.userstuff');
            case 'WORK':
                return document.querySelector('div.summary blockquote.userstuff');
        }
    }


    // ─── Stats Block ─────────────────────────────────────────────────────


    
    // Returns the language as a string
    getLanguage(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Language');
                break;
            case 'LIST':
            case 'SERIES':
            case 'WORK':
                return blurb.querySelector('dd.language').innerText;
        }
    }

    // Returns the number of words as an integer
    getWordCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Word Count');
                break;
            case 'LIST':
            case 'SERIES':
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.words').innerText);
        }
    }

    // Returns the number of chapters posted as an integer
    getChapterCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Chapter Count');
                break;
            case 'LIST':
                return this.convertStringToInteger(blurb.querySelector('dd.chapters a').innerText);
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.chapters').innerText.split('/')[0]);
        }
    }

    // Returns the estimated chapters as an integer
    getEstimatedChapters(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Estimated Chapters');
                break;
            case 'WORK':
                let estChapters = blurb.querySelector('dd.chapters').innerText.split('/')[1];
                return this.convertStringToInteger(estChapters === '?' ? '0' : estChapters);
        }
    }

    // Returns the number of comments as an integer
    getCommentCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Comments Count');
                break;
            case 'LIST':
                return this.convertStringToInteger(blurb.querySelector('dd.comments a').innerText);
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.comments').innerText);
        }
    }

    // Returns the number of kudos as an integer
    getKudosCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Kudos Count');
                break;
            case 'LIST':
                return this.convertStringToInteger(blurb.querySelector('dd.kudos a').innerText);
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.kudos').innerText);
        }
    }

    // Returns the number of bookmarks as an integer
    getBookmarkCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Count');
                break;
            case 'LIST':
            case 'SERIES':
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.bookmarks a').innerText);
        }
    }

    // Returns the number of hits as an integer
    getHitsCount(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Hit Count');
                break;
            case 'LIST':
            case 'SERIES':
            case 'WORK':
                return this.convertStringToInteger(blurb.querySelector('dd.hits').innerText);
        }
    }


    // ─── Bookmarking Information ─────────────────────────────────────────

    
    getBookmarkID(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark ID');
                break;
            case 'SERIES':
            case 'WORK':
                return document.querySelector('div#bookmark_form_placement form') ? document.querySelector('div#bookmark_form_placement form').getAttribute('action').split('/')[2] : null;
        }
    }

    // Gets the bookmark form
    getBookmarkForm(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Form');
                break;
            case 'SERIES':
            case 'WORK':
                return document.getElementById('bookmark-form');
        }
    }

    // Gets the bookmark notes
    getBookmarkNotes(pageType, blurb) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Notes');
                break;
            case 'LIST':
                return document.querySelector(`#bookmark_notes_${this.getID(pageType, blurb)}`).innerHTML;
            case 'SERIES':
            case 'WORK':
                return document.getElementById('bookmark_notes')?.innerText ?? '';
        }
    }

    // Get the user created note from notes.
    getBookmarkUserNotes(pageType, divider, defaultNote) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark User Notes');
                return;
            case 'SERIES':
            case 'WORK':
        }

        let note = (document.querySelector("div#bookmark-form textarea")?.innerText ?? '').split(divider)[0];
        if (note.includes(divider.split('\n')[1])) {
            console.warn(`${LOGNAME} Something went wrong getting user note! Did the divider change?`);
            DEBUG && console.log(`${LOGNAME} Trying again. Old note: `, note);
            let note2 = (document.querySelector("div#bookmark-form textarea")?.innerText).split((divider).split('\n')[1])[0] ?? '';
            if (!note2.length) {
                console.warn(`${LOGNAME} Failed to find user note. Regenerating default note.`)
                return defaultNote;
            }
        }
        if (!note.length) {
            return defaultNote;
        }
        return note;

    }

    // Get the old summary
    getBookmarkOldSummary(pageType, divider, index) {
        const previousSummary = (document.querySelector("div#bookmark-form textarea")?.innerText ?? '').split(divider)[index];
        const summaryWork = pageType === 'SERIES' ? document.querySelector("dl.series.meta.group blockquote.userstuff") : document.querySelector("div.preface.group div.summary.module blockquote.userstuff");
        const summaryChap = pageType === 'SERIES' ? "No Chapter Summary" : document.querySelector("div.chapter.preface.group div.summary.module blockquote.userstuff");

        if (summaryWork && !(summaryWork == summaryChap)) {
            DEBUG && console.log(`${LOGNAME} Summary Found!`);
            return summaryWork.innerHTML;
        }
        else if (previousSummary) {
            DEBUG && console.log(`${LOGNAME} Bookmark Summary Found!`);
            return previousSummary;
        }
        else {
            DEBUG && console.log(`${LOGNAME} No Summary Captured!`);
            return "No Summary Captured";
        }
    }

    // index of 1 grabs the tags, 2 grabs the collections
    getBookmarkTagsAndCollections(pageType, index, blurb = document) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Data');
                break;
            case 'LIST':
            case 'SERIES':
            case 'WORK':
                let value = Array.from(blurb.querySelectorAll('#bookmark-form form dd')[index].querySelectorAll('li.added.tag')).map(element => {
                    return element.textContent.slice(0, -2).trim();
                });
                return value;
        }
    }

    // Gets the pseud ID that is required for bookmark creation
    getPseudID(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Pseud ID');
                break;
            case 'SERIES':
            case 'WORK':
                let singlePseud = document.querySelector('input#bookmark_pseud_id');
                if (singlePseud) {
                    return singlePseud.value;
                } else {
                    // If user has multiple pseuds - use the default one to create bookmark
                    let pseudSelect = document.querySelector('select#bookmark_pseud_id');
                    return pseudSelect.value;
                }
        }
    }

    // Check if the current page is a private bookmark, true/false
    getBookmarkPrivate(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Private');
                break;
            case 'SERIES':
            case 'WORK':
                return document.querySelector('#bookmark_private').checked;
        }
    }

    // Check if the current page is a rec bookmark, true/false
    getBookmarkRecommend(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Bookmark Recommend');
                break;
            case 'SERIES':
            case 'WORK':
                return document.querySelector('#bookmark_rec').checked;
        }
    }

    // Grabs the current chapter as a link object. Grabs the last visable chapter when on entire work.
    getCurrentChapter(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Current Chapter');
                break;
            case 'WORK':
                let nodes = document.querySelectorAll("div.preface.group h3.title a");
                let chapter = (() => {
                    try {
                        return nodes[nodes.length-1];
                    } catch (error) {
                        return "Oneshot";
                    }
                })();
                return chapter;
        }
    }


    // ─── Extra Data And Functions ────────────────────────────────────────


    
    // Credit: w4tchdoge's AO3: Get Current Chapter Word Count
    getChapterWordCount(pageType) {
        switch(pageType) {
            default:
                this.defaultCatch(pageType, 'Chapter Word Count');
                return;
            case 'WORK':
        }

        // Get the Chapter Text 
        const chapter_text = (function () {
            let elm_parent = document.querySelector(`[role="article"]:has(> #work)`).cloneNode(true);
            elm_parent.removeChild(elm_parent.querySelector(`#work`));
            return elm_parent.textContent.trim();
        })();

        const script_list = [`Arabic`, `Armenian`, `Balinese`, `Bengali`, `Bopomofo`, `Braille`, `Buginese`, `Buhid`, `Canadian_Aboriginal`, `Carian`, `Cham`, `Cherokee`, `Common`, `Coptic`, `Cuneiform`, `Cypriot`, `Cyrillic`, `Deseret`, `Devanagari`, `Ethiopic`, `Georgian`, `Glagolitic`, `Gothic`, `Greek`, `Gujarati`, `Gurmukhi`, `Han`, `Hangul`, `Hanunoo`, `Hebrew`, `Hiragana`, `Inherited`, `Kannada`, `Katakana`, `Kayah_Li`, `Kharoshthi`, `Khmer`, `Lao`, `Latin`, `Lepcha`, `Limbu`, `Linear_B`, `Lycian`, `Lydian`, `Malayalam`, `Mongolian`, `Myanmar`, `New_Tai_Lue`, `Nko`, `Ogham`, `Ol_Chiki`, `Old_Italic`, `Old_Persian`, `Oriya`, `Osmanya`, `Phags_Pa`, `Phoenician`, `Rejang`, `Runic`, `Saurashtra`, `Shavian`, `Sinhala`, `Sundanese`, `Syloti_Nagri`, `Syriac`, `Tagalog`, `Tagbanwa`, `Tai_Le`, `Tamil`, `Telugu`, `Thaana`, `Thai`, `Tibetan`, `Tifinagh`, `Ugaritic`, `Vai`, `Yi`];
        const script_exclude_list = [`Common`, `Latin`, `Inherited`];

        // Counting the number of words
        const word_count_regex = new RegExp((function () {
            const regex_scripts = script_list.filter((elm) => !script_exclude_list.includes(elm)).map((elm) => `\\p{Script=${elm}}`).join(``);
            const full_regex_str = `[${regex_scripts}]|((?![${regex_scripts}])[\\p{Letter}\\p{Mark}\\p{Number}\\p{Connector_Punctuation}])+`;
            return full_regex_str;
        })(), `gv`);
        const word_count_arr = Array.from(chapter_text.replaceAll(/--/g, `—`).replaceAll(/['’‘-]/g, ``).matchAll(word_count_regex), (m) => m[0]);
        const word_count_int = word_count_arr.length;
        DEBUG && console.log(`${LOGNAME} Chapter Word Count: ${word_count_int}`);
        return word_count_int;
    }
    
    // Gets the current time in UTC
    getCurrentTime() {
        const current = new Date();
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const hour = String(current.getHours()).padStart(2, '0');
        const minute = String(current.getMinutes()).padStart(2, '0');

        let fullMonth;
        switch(month) {
            case 0:
                fullMonth = "January";
                break;
            case 1:
                fullMonth = "February";
                break;
            case 2:
                fullMonth = "March";
                break;
            case 3:
                fullMonth = "April";
                break;
            case 4:
                fullMonth = "May";
                break;
            case 5:
                fullMonth = "June";
                break;
            case 6:
                fullMonth = "July";
                break;
            case 7:
                fullMonth = "August";
                break;
            case 8:
                fullMonth = "September";
                break;
            case 9:
                fullMonth = "October";
                break;
            case 10:
                fullMonth = "November";
                break;
            case 11:
                fullMonth = "December";
                break;
        }

        return [current, year, month, day, hour, minute, fullMonth];
    }

    convertTimeToFormat(time, format) {
        switch(format) {
                default:
                    return `${time[2]}/${time[1]}`;
                case 'Day/Month/Year':
                    return `${time[3]}/${time[2]}/${time[1]}`;
                case 'Month/Day/Year':
                    return `${time[2]}/${time[3]}/${time[1]}`;
                case 'Worded Month/Year':
                    return `${time[6]} ${time[1]}`;
                case 'Worded Day/Month/Year':
                    return `${time[3]} ${time[6]} ${time[1]}`;
                case 'Worded Month/Day/Year':
                    return `${time[6]} ${time[3]}, ${time[1]}`;
                case 'Exact Day/Month/Year':
                    return `${time[3]}/${time[2]}/${time[1]} | ${time[4]}:${time[5]}`;
                case 'Exact Month/Day/Year':
                    return `${time[2]}/${time[3]}/${time[1]} | ${time[4]}:${time[5]}`;
                case 'Exact Worded Day/Month/Year':
                    return `${time[3]} ${time[6]} ${time[1]} | ${time[4]}:${time[5]}`;
                case 'Exact Worded Month/Day/Year':
                    return `${time[6]} ${time[3]}, ${time[1]} | ${time[4]}:${time[5]}`;
            }
    }

    // Gets rid of any commas or spaces before converting to an int
    convertStringToInteger(string) {
        if (string.includes(",")) {
            string = string.replaceAll(",", ""); 
        }
        if (string.includes(" ")) {
            string = string.replaceAll(" ", "");
        }
        if (string.includes(" ")) {
            string = string.replaceAll(/\s/g, ""); 
        }
        return parseInt(string);
    }

}



// ─── Create Http Requests To Ao3 ─────────────────────────────────────────────

/*
    How does this work? Not entirely sure!

    Anyway, the Bookmark class calls this one to create and update bookmarks
    using the requestHandler function. All it passes along is the bookmark
    data and what work it is for after choosing between bookmarkCreate and 
    bookmarkUpdate.
*/

class ManageRequest {
    constructor() {
        this.token = this.getAuthenticityToken();
    }

    // Send an API request with the specified method
    sendRequest(url, formData, headers, method = "POST") {
        return fetch(url, {
                method: method,
                mode: "cors",
                credentials: "include",
                headers: headers,
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`${LOGNAME} Request failed with status ${response.status}`);
                }
                return response;
            })
            .catch(error => {
                DEBUG && console.error(`${LOGNAME} Error during API request:`, error);
                throw error;
            });
    }

    // Retrieve the authenticity token from a meta tag
    getAuthenticityToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.getAttribute('content') : null;
    }
    
    // Retrieve the request headers
    getRequestHeaders() {
        const headers = {
            "Accept": "text/html", // Accepted content type
            "Cache-Control": "no-cache", // Prevent caching
            "Pragma": "no-cache", // HTTP 1.0 compatibility
        };
        return headers;
    }


    // ─── Bookmark Requests ───────────────────────────────────────────────

    

    // Create a bookmark for fanfic with given data
    bookmarkCreate(workId, bookmarkData) {
        const url = `https://archiveofourown.org/works/${workId}/bookmarks`;
        const headers = this.getRequestHeaders();

        const formData = this.bookmarkForm(this.token, bookmarkData);

        DEBUG && console.info(`${LOGNAME} Sending CREATE request for bookmark:`, {
            url,
            headers,
            bookmarkData
        });

        return this.sendRequest(url, formData, headers)
            .then(response => {
                if (response.ok) {
                    const bookmarkId = response.url.split('/').pop();

                    console.info(`${LOGNAME} Created bookmark ID:`, bookmarkId);
                    return bookmarkId;
                } else {
                    throw new Error(`${LOGNAME} Failed to create bookmark. Status: ${response.status}`);
                }
            })
            .catch(error => {
                DEBUG && console.error(`${LOGNAME} Error creating bookmark:`, error);
                throw error;
            });
    }

    // Update a bookmark for fanfic with given data
    bookmarkUpdate(bookmarkId, updatedData) {
        const url = `https://archiveofourown.org//bookmarks/${bookmarkId}`;
        const headers = this.getRequestHeaders();
        const formData = this.bookmarkForm(this.token, updatedData, 'update');

        DEBUG && console.info(`${LOGNAME} Sending UPDATE request for bookmark:`, {
            url,
            headers,
            updatedData
        });

        return this.sendRequest(url, formData, headers)
            .then(data => {
                console.info(`${LOGNAME} Bookmark updated successfully:`, data);
            })
            .catch(error => {
                console.error(`${LOGNAME} Error updating bookmark:`, error);
            });
    }

    // Create FormData for bookmarking actions based on action type
    bookmarkForm(authToken, bookmarkData, type = 'create') {
        const bookmarkEntry = new FormData();

        // Append required data to FormData
        bookmarkEntry.append('authenticity_token', authToken);
        bookmarkEntry.append("bookmark[pseud_id]", bookmarkData.pseudID);
        bookmarkEntry.append("bookmark[bookmarker_notes]", bookmarkData.notes);
        bookmarkEntry.append("bookmark[tag_string]", bookmarkData.tags.join(','));
        bookmarkEntry.append("bookmark[collection_names]", bookmarkData.collections.join(','));
        bookmarkEntry.append("bookmark[private]", +bookmarkData.isPrivate);
        bookmarkEntry.append("bookmark[rec]", +bookmarkData.isRec);

        // Append action type
        bookmarkEntry.append("commit", type === 'create' ? "Create" : "Update");
        if (type === 'update') {
            bookmarkEntry.append("_method", "put");
        }

        DEBUG && console.log(`${LOGNAME} Bookmark Entry FormData created successfully:`);
        DEBUG && console.table(Array.from(bookmarkEntry.entries()));

        return bookmarkEntry;
    }
}



// ─── Handle Loading Settings And The Gui ─────────────────────────────────────

/*
    Look at that box! Isn't it beautiful?

    This is the first class to be ran. The first function it runs checks for
    any settings saved to local storage in the browser otherwise it uses the
    default set at the beginning of the file.
*/

class ManageSettings {
    constructor() {
        this.loadSettings();
        console.info(`${LOGNAME} Initialized Settings:`, LOADED_SETTINGS);
    }

    // Load settings from storage or fallback to default ones
    loadSettings() {
        const startTime = performance.now();
        const savedSettings = localStorage.getItem(`${KEYCHAIN}-${USERNAME}-SavedSettings`);

        if (savedSettings) {
            try {
                LOADED_SETTINGS = JSON.parse(savedSettings);
                DEBUG && console.log(`${LOGNAME} Settings loaded successfully:`, savedSettings);
            } catch (error) {
                DEBUG && console.error(`${LOGNAME} Error parsing settings: ${error}`);
                LOADED_SETTINGS = DEFAULT_SETTINGS;
            }
        } else {
            LOADED_SETTINGS = DEFAULT_SETTINGS;
            console.warn(`${LOGNAME} No saved settings found, using default settings.`);
        }

        const endTime = performance.now();
        DEBUG && console.log(`${LOGNAME} Settings loaded in ${endTime - startTime} ms`);
    }

}



// ─── Manage The Local Storage ────────────────────────────────────────────────

/*
    JSON fuckery with saving arrays as strings.

    What more needs to be said?
*/

class ManageStorage {

    // Create an array in local storage if it doesn't exist
    arrayInit(key) {
        if (!localStorage.getItem(key)) {
            console.log(`${LOGNAME} Initilized Storage: ${key}`);
            DEBUG && console.log(`${LOGNAME} Previous Value: ${localStorage.getItem(key)}`);
            localStorage.setItem(key, JSON.stringify([]));
        }
    }

    // Get array from storage
    arrayGet(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    // Add values to array in local storage if they don't exist
    arrayAdd(key, value) {
        const existingValues = this.arrayGet(key);
        const arrayValues = existingValues ? existingValues : [];

        if (!arrayValues.includes(value)) {
            arrayValues.push(value);
            localStorage.setItem(key, JSON.stringify(arrayValues));
            DEBUG && console.debug(`${LOGNAME} Added Value to Key "${key}": ${value}`);
        }
    }

    // Remove values from array in local storage if they do exist
    arrayRemove(key, value) {
        const existingValues = this.arrayGet(key);
        const arrayValues = existingValues ? existingValues : [];

        const index = arrayValues.indexOf(value);
        if (index !== -1) {
            arrayValues.splice(index, 1);
            localStorage.setItem(key, JSON.stringify(arrayValues));
            DEBUG && console.debug(`${LOGNAME} Removed Value from Key "${key}": ${value}`);
        }
    }

}



// ─── Manage Style Settings ───────────────────────────────────────────────────

/*

*/

class ManageStyle {
    static addStyle(debugID, css) {
        const style = document.createElement('style');
        style.id = ELEMENTID;
        style.innerHTML = css;
        document.head.appendChild(style);
        DEBUG && console.info(`${LOGNAME} Style ${debugID} appended.`);
    }
}



// ─── Main Class ──────────────────────────────────────────────────────────────

/*
    This is the class that activates the modules based on the settings.

    The 'new Main();' at the very end is very important. Do not remove it.
    Its placement at the very end means that the entire script is read before
    pulling all the pieces together. Functions can't be ran before the code
    for that function has been read.
*/

class Main {
    constructor() {
        new ManageSettings();
        if (!LOADED_SETTINGS.enabled) {
            console.info(`${LOGNAME} Disabled All Tweaks.`)
            return;
        }

        LOADED_SETTINGS.Tracking.enabled ? this.handleBookmark() : console.info(`${LOGNAME} Disabled Bookmark.`);
        LOADED_SETTINGS.ReadTime.enabled ? new ReadTime() : console.info(`${LOGNAME} Disabled ReadTime.`);

    }

    handleBookmark() {
        const bookmarkable = document.getElementById('bookmark_tag_string_autocomplete') ? true : false
        const blurbWork = document.querySelector('dl.work.meta.group');
        const blurbSeries = document.querySelector('dl.series.meta.group');

        if (bookmarkable && blurbSeries) {
            new Tracking('SERIES', blurbSeries);
        }
        if (bookmarkable && blurbWork) {
            new Tracking('WORK', blurbWork)
        }
        
        // A list of blurbs exists on the page
        let blurbs = document.querySelectorAll('li.work.blurb, li.bookmark.blurb, li.series.blurb');
        blurbs.forEach((blurb) => {
            new Tracking('LIST', blurb);
        });
    }
}

// Finally! Begin!
new Main();