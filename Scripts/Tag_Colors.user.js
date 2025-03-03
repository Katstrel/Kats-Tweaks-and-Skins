// ==UserScript==
// @name         [AO3] Kat's Tweaks: Tag & Bookmark Colors
// @author       Katstrel
// @description  Allows for color coding bookmarks and more.
// @version      0.1.0
// @namespace    https://github.com/Katstrel/Kats-Tweaks-and-Skins
// @include      https://archiveofourown.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=archiveofourown.org
// @require      https://cdnjs.cloudflare.com/ajax/libs/jscolor/2.5.2/jscolor.min.js
// @grant        none
// @updateURL    https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/Scripts/Tag_Colors.user.js
// @downloadURL  https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/Scripts/Tag_Colors.user.js
// ==/UserScript==
"use strict";
let DEBUG = true;

// তততততততত SETTINGS তততততততত //

let SETTINGS = {
    tagColor: {
        enabled: true,
        databaseWarn: [
            {
                keyID: "no-warn",
                tagName: "No Warnings Apply",
                color: '#80ff8080',
            },
            {
                keyID: "choose-not",
                tagName: "Choose Not To Use",
                color: '#ffff8080',
            },
            {
                keyID: "violence",
                tagName: "Graphic Violence",
                color: '#ff808080',
            },
            {
                keyID: "mcd",
                tagName: "Major Character Death",
                color: '#80808080',
            },
            {
                keyID: "noncon",
                tagName: "Non-Con",
                color: '#80ffff80',
            },
            {
                keyID: "underage",
                tagName: "Underage",
                color: '#8080ff80',
            },
        ],
        databaseShip: [
            {
                keyID: "example",
                tagName: 'Example/Example',
                color: '#80808080',
            },
        ],
        databaseChar: [
            {
                keyID: "example",
                tagName: 'Example Character',
                color: '#80808080',
            },
        ],
        databaseFree: [
            {
                keyID: "example",
                tagName: 'Example Tag',
                color: '#80808080',
            },
        ],
    }
};

// তততততত STOP SETTINGS তততততত //

class TagColors {
    constructor(settings, moduleID) {
        this.id = moduleID;
        this.settings = settings.tagColor;
        this.bookmark = settings.bookmarking;

        // All blurbs
        document.querySelectorAll('li.work.blurb, li.bookmark.blurb, dl.work.meta, dl.series.meta, li.series.blurb').forEach(blurb=> {
            if (blurb.querySelector('p.message')) { return; }
            DEBUG && console.log(`[Kat's Tweaks] Blurb found: `, blurb);

            this.blurbTags(blurb, 'li.warnings a', this.settings.databaseWarn);
            this.blurbTags(blurb, 'li.relationships a', this.settings.databaseShip);
            this.blurbTags(blurb, 'li.characters a', this.settings.databaseChar);
            this.blurbTags(blurb, 'li.freeforms a', this.settings.databaseFree);

        });
    }

    blurbTags(blurb, query, database) {
        let tags = blurb.querySelectorAll(`ul.tags ${query}`);
        DEBUG && console.log(`[Kat's Tweaks] Tags found: `, tags);
        tags.forEach(tag => {
            database.forEach(({keyID, tagName, color}) => {
                if (tag.innerText == tagName) {
                    tag.style.backgroundColor = color;
                    DEBUG && console.log(`[Kat's Tweaks] Tag ${tagName} set to ${color}`);
                }
            });
        });
    }

}

class Main {
    constructor() {
        this.settings = this.loadSettings();
        if (this.settings.tagColor.enabled) {
            let moduleID = "KT-COLR";
            console.info(`[Kat's Tweaks] Tag Color | Initialized with:`, this.settings.tagColor);
            new TagColors(this.settings, moduleID);
        }
    }

    // Load settings from the storage or fallback to default ones
    loadSettings() {
        const startTime = performance.now();
        let savedSettings = localStorage.getItem('KT-SavedSettings');
        let settings = SETTINGS;

        if (savedSettings) {
            try {
                let parse = JSON.parse(savedSettings);
                DEBUG && console.log(`[Kat's Tweaks] Settings loaded successfully:`, savedSettings);
                if (parse.tagColor) {
                    settings = parse;
                }
            } catch (error) {
                DEBUG && console.error(`[Kat's Tweaks] Error parsing settings: ${error}`);
            }
        } else {
            DEBUG && console.warn(`[Kat's Tweaks] No saved settings found for Tag Color, using default settings.`);
        }

        const endTime = performance.now();
        DEBUG && console.log(`[Kat's Tweaks] Settings loaded in ${endTime - startTime} ms`);
        return settings;
    }
}

new Main();