// ==UserScript==
// @name         [AO3] Kat's Tweaks: Read Time & Word Count
// @author       Katstrel
// @description  Adds chapter word count, chapter read time, and work read time to stats in the blurb.
// @version      1.0
// @namespace    https://github.com/Katstrel/Kats-Tweaks-and-Skins
// @include      https://archiveofourown.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=archiveofourown.org
// @grant        none
// @updateURL    https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/main/Scripts/Read_Time_and_Word_Count.js
// @downloadURL  https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/main/Scripts/Read_Time_and_Word_Count.js
// ==/UserScript==
"use strict";
let DEBUG = false;

// তততততততত SETTINGS তততততততত //

let settings = {
    readTime: {
        wordsPerMinute: 200,
        lvlMins1: 60,
        lvlMins2: 180,
        highlightLevel0: 'rgba(0, 204, 0, 0.25)',
        highlightLevel1: 'rgba(255, 255, 0, 0.25)',
        highlightLevel2: 'rgba(204, 0, 0, 0.25)',
    }
}

// তততততত STOP SETTINGS তততততত //

/* Parts of code used or based on:
AO3 Bookmarking Records by Bairdel
AO3: Estimated Reading Time v2 by lomky
AO3: Get Current Chapter Word Count by w4tchdoge
*/

// StyleManager v1.0 
class StyleManager {
    // Creates a term and definition and appends after given dd query value
    static addDLItem(querySelect, term, definiton, styleClass) {
        const descListTerm = Object.assign(document.createElement(`dt`), {
            id: `katstweaks`,
            className: styleClass || "",
            textContent: term || "",
        });
        const descListDefine = Object.assign(document.createElement(`dd`), {
            id: `katstweaks`,
            className: styleClass || "",
            textContent: definiton || ""
        });

        querySelect.after(descListTerm, descListDefine);
        DEBUG && console.info(`[Kat's Tweaks] Custom DLItem '${term}' added successfully`);
        return [descListTerm, descListDefine]
    }
}

class ReadTime {
    constructor() {
        DEBUG && console.log(`[Kat's Tweaks] Initializing ReadTime`);

        // Performs the Read Time on all blurbs
        document.querySelectorAll('li.work.blurb, li.bookmark.blurb, dl.work.meta, dl.series.meta').forEach(blurb=> {
            let wordCount = this.getWordCount(blurb);
            this.calculateTime(blurb.querySelector('dd.words'), wordCount);
        });

        // Chapter Word Count and Read Time if more than one chapter exists
        if (document.querySelector(`dl.work.meta dl.stats dd.chapters`)) {
            let chapCount = parseInt(document.querySelector(`dd.stats dd.chapters`).textContent.split(`/`).at(0));
            if (window.location.pathname.toLowerCase().includes(`chapters`) && chapCount > 1) {
                const chapWord = this.chapWordCount();
                const formatCount = new Intl.NumberFormat({ style: `decimal` }).format(chapWord);
                StyleManager.addDLItem(document.querySelector('dl.stats dd.chapters'), 'Words in Chapter:', formatCount, 'chapterWords')
                this.calculateTime(document.querySelector('dd#katstweaks.chapterWords'), chapWord, 'Chapter');
            }
        }
    }

    getWordCount(blurb) {
        let words = blurb.querySelector('dd.words').innerText;
        if (words.includes(",")) {
            words = words.replaceAll(",", ""); 
        }
        if (words.includes(" ")) {
            words = words.replaceAll(" ", "");
        }
        if (words.includes(" ")) {
            words = words.replaceAll(/\s/g, ""); 
        }
    
        let wordsINT = parseInt(words);
        DEBUG && console.log(`[Kat's Tweaks] Work Word Count: ${wordsINT}`);
        return wordsINT;
    }

    calculateTime(querySelect, wordCount, type = '') {
        let minutes = wordCount/(settings.readTime.wordsPerMinute);
        let hrs = Math.floor(minutes/60);
        let mins = (minutes%60).toFixed(0);

        // Get minutes with zero decimal points
        let timePrint = hrs > 0 ? hrs + "h" + mins + "m" : mins + "m"
        console.log(`[Kat's Tweaks] Read Time ${type}: ${wordCount} (${timePrint})`)

        // Add readtime stats
        let dlItem = StyleManager.addDLItem(querySelect, `${type} Readtime:`, timePrint, 'readtime')
        if (minutes <= settings.readTime.lvlMins1) {
            dlItem[1].style.backgroundColor = settings.readTime.highlightLevel0;
        }
        else if (minutes <= settings.readTime.lvlMins2) {
            dlItem[1].style.backgroundColor = settings.readTime.highlightLevel1;
        }
        else {
            dlItem[1].style.backgroundColor = settings.readTime.highlightLevel2;
        }
    }
    
    // Credit: w4tchdoge's AO3: Get Current Chapter Word Count
    chapWordCount() {
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
        DEBUG && console.log(`[Kat's Tweaks] Chapter Word Count: ${word_count_int}`);
        return word_count_int;
    }

}

const main = new ReadTime();