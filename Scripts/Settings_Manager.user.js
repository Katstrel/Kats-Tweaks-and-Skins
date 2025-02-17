// ==UserScript==
// @name         [AO3] Kat's Tweaks: Settings Manager
// @author       Katstrel
// @description  Controls the storage and modification of various settings for all Kat's Tweaks scripts.
// @version      1.0
// @namespace    https://github.com/Katstrel/Kats-Tweaks-and-Skins
// @include      https://archiveofourown.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=archiveofourown.org
// @require      https://cdnjs.cloudflare.com/ajax/libs/jscolor/2.5.2/jscolor.min.js
// @grant        none
// @updateURL    https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/Scripts/Settings_Manager.user.js
// @downloadURL  https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/Scripts/Settings_Manager.user.js
// ==/UserScript==
"use strict";
let DEBUG = false;

/*
    This userscript is to be used in conjuntion with the other scripts I've released.
    Set all scripts to update automatically and they should be good to go!
    Do NOT edit settings here, edit them in your preference page on AO3
    For users without an account, use the button on the header bar.
*/

let LOADED_SETTINGS = {};
let DEFAULT_SETTINGS = {
    debugMode: false,
    reversi: false,
    readTime: {
        enabled: true,
        wordsPerMinute: 200,
        levels: [
            {
                id: "Level_0",
                name: "Level_0",
                mins: 0,
                color: '#80ff8080',
            },
            {
                id: "Level_1",
                name: "Level_1",
                mins: 60,
                color: '#ffff8080',
            },
            {
                id: "Level_2",
                name: "Level_2",
                mins: 180,
                color: '#ff808080',
            },
        ],
    },
};

class SettingsManager {
    constructor() {
        this.dropMenu = this.createHeader();
        this.dropMenu.append(
            this.getMenuButton('Report Issue/Request Feature', function () {
                window.open("https://github.com/Katstrel/Kats-Tweaks-and-Skins/issues/new", '_blank').focus();
            }),
            this.getMenuButton('Main Settings | Import/Export', this.manageSettings),
            this.getMenuButton('— Tweaks Modules —'),
            this.getMenuButton('Read Time & Word Count', this.initReadTime),
        );
    }

    manageSettings() {
        let container = StyleManager.SETM_SettingsContainer();
        new SettingsMain(container);
    }

    initReadTime() {
        let container = StyleManager.SETM_SettingsContainer();
        new SettingsReadTime(container);
    }

    getMenuButton(text, func) {
        let button = document.createElement('li');
        let label = document.createElement('a');
        button.append(label);

        //button.className = 'menu dropdown-menu';
        label.textContent = text;

        if (func) {
            button.addEventListener("click", (func));
            button.classList.add('KT-SETM-menu-setting');
        }
        else {
            button.classList.add('KT-SETM-menu-header');
        }
        return button;
    }

    createHeader() {
        let header = document.querySelector('ul.primary.navigation.actions');
        let menu = document.createElement('li');
        header.querySelector('li.search').before(menu);

        let label = document.createElement('a');
        let drop = document.createElement('ul');
        menu.append(label);
        menu.append(drop);

        menu.id = 'KT-SETM-dropdown';
        menu.className = 'dropdown';
        label.textContent = "Kat's Tweaks";
        drop.className = 'menu dropdown-menu';
        
        return drop;
    }
}

class SettingsMain {
    constructor(container) {
        this.id = "KT-SETM";
        this.settings = LOADED_SETTINGS;
        this.container = container;

        let text = document.createElement('p');
        text.textContent = `WORK IN PROGRESS\nWill be added in the future!`;
        this.container.append(text);

        // Actions Footer
        StyleManager.SETM_ActionsMenu(this.container);
        document.getElementById('KT-SETM-optionssave').addEventListener("click", () => {
            this.saveSettings();
        });
    }

    saveSettings() {
        let confirmed = confirm('Sure you want to save these settings?');

        

        if (confirmed) {
            LOADED_SETTINGS = this.settings;
            DEBUG && console.log(`[Kat's Tweaks] Settings Saved:`, LOADED_SETTINGS);
        }
    }
}

// Read Time & Word Count Module
class SettingsReadTime {
    constructor(container) {
        this.id = "KT-RTWC";
        this.container = container;
        this.settings = this.moduleSettingValidation();
        
        let title = Object.assign(document.createElement('h1'), {
            textContent: "Read Time & Word Count",
        });
        this.container.append(title);

        this.moduleEnabled();
        StyleManager.SETM_HardRule(this.container);

        this.container.append(Object.assign(document.createElement('h2'), {
            textContent: "Reading Speed",
        }));
        this.container.append(Object.assign(document.createElement('p'), {
            textContent: `What is reading speed? You can get your reading speed by dividing the number of words a work has over by how many minutes it took to read it! This script will use your value to calculate how long it should take to read works.`,
        }));
        this.wordSpeed();
        StyleManager.SETM_HardRule(this.container);

        this.container.append(Object.assign(document.createElement('h2'), {
            textContent: "Time Levels",
        }));
        this.container.append(Object.assign(document.createElement('p'), {
            textContent: `Levels are super customizable for color coding how long it should take to read works! Simply enter the number of minutes it should take before the color code is used and change the color if you prefer.`,
        }));
        this.readingLevels();
        
        // Actions Footer
        StyleManager.SETM_ActionsMenu(this.container);
        document.getElementById('KT-SETM-optionssave').addEventListener("click", () => {
            this.saveSettings();
        });

    }
    
    moduleEnabled() {
        let container = StyleManager.SETM_OptionContainer(this.container);

        let enabled = Object.assign(document.createElement(`input`), {
            id: `${this.id}-enabled`,
            type: 'checkbox',
            checked: this.settings.enabled,
        });
        let label = Object.assign(document.createElement(`label`), {
            htmlFor: `${this.id}-enabled`,
            textContent: "Module Enable/Disable",
        });
        let link = Object.assign(document.createElement(`a`), {
            href: 'https://github.com/Katstrel/Kats-Tweaks-and-Skins/raw/refs/heads/main/Scripts/Read_Time_and_Word_Count.user.js',
            textContent: 'Need the Module?',
        });

        container.append(enabled);
        container.append(label);
        container.append(document.createElement('br'));
        container.append(link);
    }

    wordSpeed() {
        let container = StyleManager.SETM_OptionContainer(this.container);
        Object.assign(StyleManager.SETM_SpanInLine(container), {
            innerText: "Words per Minute:",
        })

        let words = Object.assign(document.createElement(`input`), {
            id: `${this.id}-wpm`,
            type: 'text',
            onkeydown: "return StyleManager.isNumberKey(event)",
            value: this.settings.wordsPerMinute,
            min: 0,
        });

        container.append(words);

        StyleManager.setInputFilter(document.getElementById(`${this.id}-wpm`), function(value) {
            return /^\d*\.?\d*$/.test(value); // Allow digits and '.' only, using a RegExp.
        }, "Only numbers are allowed!");
    }

    readingLevels() {
        let container = StyleManager.SETM_OptionContainer(this.container);

        // Create the existing Levels
        let levelContainer = StyleManager.SETM_OptionContainer(container);
        DEBUG && console.log(`[Kat's Tweaks] Levels: `, this.settings.levels)
        this.settings.levels.forEach(({id, name, mins, color}) => {
            this.drawLevel(levelContainer, this.id, id, name, mins, color);
        });

        // Add Levels Input
        container.append(Object.assign(document.createElement('input'), {
            type: 'text',
            id: `${this.id}-addlevel-text`,
            value: ""
        }));
        StyleManager.setInputFilter(document.getElementById(`${this.id}-addlevel-text`), function(value) {
            return /^[a-zA-Z0-9\-\_]{0,12}$/.test(value);
        }, "Only letters, dashes(-), and underscores(_) up to 12 characters are allowed!");

        container.append(Object.assign(document.createElement('input'), {
            type: 'button',
            id: `${this.id}-addlevel`,
            value: 'Add Level',
        }));
        document.getElementById(`${this.id}-addlevel`).addEventListener("click", () => {
            let textValue = document.getElementById(`${this.id}-addlevel-text`).value;
            let alreadyUsed = false;
            this.settings.levels.forEach(({id}) => {
                DEBUG && console.log(`[Kat's Tweaks] Testing id: `, id);
                if (id == `${textValue}`) {
                    alreadyUsed = true;
                }
            });

            if (`${textValue}` == "") {
                DEBUG && console.log(`[Kat's Tweaks] Level ID is empty!`);
                let box = document.getElementById(`${this.id}-addlevel-text`);
                box.classList.add("input-error");
                box.setCustomValidity("ID can't be empty!");
                box.reportValidity();
                return;
            }
            else if (alreadyUsed) {
                DEBUG && console.log(`[Kat's Tweaks] Level ID already in use!`);
                let box = document.getElementById(`${this.id}-addlevel-text`);
                box.classList.add("input-error");
                box.setCustomValidity("ID is already in use!");
                box.reportValidity();
                return;
            }
            else {
                this.settings.levels.push({
                    id: `${textValue}`,
                    name: `${textValue}`,
                    mins: 0,
                    color: '#80808080',
                });
                this.drawLevel(levelContainer, this.id, `${textValue}`, `${textValue}`, 0, '#80808080');
                DEBUG && console.log(`[Kat's Tweaks] Levels: `, this.settings.levels);
            }
        });

        // Creates the Level Options for each level
        
    }
    
    drawLevel(levelContainer, moduleID, levelID, levelName, levelMins, levelColor) {
        jscolor.init();
        let newLevel = StyleManager.SETM_OptionContainer(levelContainer, `${moduleID}-levelContainer-${levelID}`);
        levelContainer.append(newLevel);
        let label = Object.assign(StyleManager.SETM_SpanInLine(newLevel), {
            innerText: `${levelName}`,
            id: `${moduleID}-levelLabel-${levelID}`,
        })
        label.style.backgroundColor = levelColor;

        // Minutes
        newLevel.append(Object.assign(document.createElement(`input`), {
            id: `${moduleID}-level-${levelID}`,
            type: 'text',
            value: levelMins,
        }));
        StyleManager.setInputFilter(document.getElementById(`${moduleID}-level-${levelID}`), function(value) {
            return /^\d*\.?\d*$/.test(value);
        }, "Only numbers are allowed!");

        // Create Color Picker
        newLevel.append(Object.assign(document.createElement('span'), {
            id: `${moduleID}-colorSpan-${levelID}`,
        }));
        document.getElementById(`${moduleID}-colorSpan-${levelID}`).innerHTML += `<input id="${moduleID}-colorPick-${levelID}" data-jscolor="{}" value="#80808080">`
        jscolor.install() // recognizes new inputs and installs jscolor on them
        
        // Color Picker
        let colorPick = document.getElementById(`${moduleID}-colorPick-${levelID}`);
        colorPick.jscolor.alphaChannel = true;
        colorPick.jscolor.format = 'any';
        colorPick.jscolor.fromString(`${levelColor}`);
        colorPick.addEventListener("input", function(e) {
            document.getElementById(`${moduleID}-levelLabel-${levelID}`).style.background = colorPick.jscolor.toHEXAString();
        });
        if (LOADED_SETTINGS.reversi) {
            colorPick.jscolor.backgroundColor = 'rgb(51, 51, 51)';
            colorPick.jscolor.borderColor = 'rgb(1, 1, 1)';
            colorPick.jscolor.controlBorderColor = 'rgb(1, 1, 1)';
        }

        DEBUG && console.log(`[Kat's Tweaks] Levels this. check: `, this.settings.levels);

        // Rename Level
        newLevel.append(Object.assign(document.createElement('input'), {
            type: 'button',
            id: `${moduleID}-renameLevel-${levelID}`,
            value: 'Rename',
        }));
        document.getElementById(`${moduleID}-renameLevel-${levelID}`).addEventListener("click", () => {
            this.settings.levels.forEach(({id}, index, array) => {
                if (id == levelID) {
                    let newName = prompt(`[Kat's Tweaks] Renaming ${levelName} (${levelID})\nEnter New Name:`);
                    array[index].name = newName;
                    document.getElementById(`${moduleID}-levelLabel-${levelID}`).innerText = newName;
                }
            });
        });
        
        // Remove Level
        newLevel.append(Object.assign(document.createElement('input'), {
            type: 'button',
            id: `${moduleID}-removeLevel-${levelID}`,
            className: 'removeLevel',
            value: 'Remove',
        }));


        document.querySelectorAll(`#${moduleID}-removeLevel-${levelID}`).forEach(button => {
            button.addEventListener('click', () => {
                this.settings.levels.forEach(({id}, index, array) => {
                    if (id == levelID) {
                        array.splice(index);
                        DEBUG && console.log(`[Kat's Tweaks] Level Remove ${levelID} | New Levels List: `, this.settings.levels);
                        document.querySelectorAll(`#${moduleID}-levelContainer-${levelID}`).forEach(function() {
                            document.getElementById(`${moduleID}-levelContainer-${levelID}`).remove();
                        })
                    }
                });
            })
        });

        newLevel.append(document.createElement('hr'));
    }

    saveSettings() {
        let confirmed = confirm('Sure you want to save these settings?');

        this.settings.enabled = document.getElementById(`${this.id}-enabled`).checked;
        this.settings.wordsPerMinute = document.getElementById(`${this.id}-wpm`).value;

        // forEach (function (values, index, array) => {}) WHY AM I ONLY NOW LEARNING THIS?!
        this.settings.levels.forEach(({id}, index, array) => {
            array[index].name = document.getElementById(`${this.id}-levelLabel-${id}`).innerText;
            array[index].mins = document.getElementById(`${this.id}-level-${id}`).value;
            array[index].color = document.getElementById(`${this.id}-colorPick-${id}`).jscolor.toHEXAString();
        });

        if (confirmed) {
            LOADED_SETTINGS.readTime = this.settings;
            localStorage.setItem('KT-SavedSettings', JSON.stringify(LOADED_SETTINGS));
            DEBUG && console.log(`[Kat's Tweaks] Settings Saved:`, LOADED_SETTINGS);
        }
    }

    moduleSettingValidation() {
        let setDefault = DEFAULT_SETTINGS.readTime;
        let setLoaded = LOADED_SETTINGS.readTime;
        let settings = setLoaded || setDefault;

        settings.enabled = setLoaded.enabled || setDefault.enabled;
        settings.wordsPerMinute = setLoaded.wordsPerMinute || setDefault.wordsPerMinute;
        settings.levels = setLoaded.levels || setDefault.levels;

        return settings;
    }
}

class StyleManager {
    static addStyle(debugID, css) {
        const customStyle = document.createElement('style');
        customStyle.id = 'KT';
        customStyle.innerHTML = css;
        document.head.appendChild(customStyle);
        DEBUG && console.info(`[Kat's Tweaks] Custom style '${debugID}' added successfully`);
    }

    // Restricts input for the given textbox to the given inputFilter function.
    // https://stackoverflow.com/questions/469357/html-text-input-allow-only-numeric-input
    static setInputFilter(textbox, inputFilter, errMsg) {
        [ "input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop", "focusout" ].forEach(function(event) {
            textbox.addEventListener(event, function(e) {
                if (inputFilter(this.value)) {
                    // Accepted value.
                    if ([ "keydown", "mousedown", "focusout" ].indexOf(e.type) >= 0){
                      this.classList.remove("input-error");
                      this.setCustomValidity("");
                    }

                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                }
                else if (this.hasOwnProperty("oldValue")) {
                    // Rejected value: restore the previous one.
                    this.classList.add("input-error");
                    this.setCustomValidity(errMsg);
                    this.reportValidity();
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
                else {
                    // Rejected value: nothing to restore.
                    this.value = "";
                }
            });
        });
    }

    static SETM_SettingsContainer() {
        let background = document.createElement('div');
        background.id = 'KT-SETM-optionsbackground';
        background.style.background = 'rgba(0, 0, 0, 0.75)';
        background.style.position = 'fixed';
        background.style.width = '100%';
        background.style.height = '100%';

        let box = document.createElement('div');
        box.id = 'KT-SETM-optionsbox';

        document.body.append(background);
        document.querySelector('#main').append(box);
        
        return box;
    }

    static SETM_ActionsMenu(container) {
        let footer = Object.assign(document.createElement('p'), {
            className: 'actions',
        });

        let saveButton = Object.assign(document.createElement('input'), {
            type: 'button',
            id: 'KT-SETM-optionssave',
            value: 'Save',
        });

        let closeButton = Object.assign(document.createElement('input'), {
            type: 'button',
            id: 'KT-SETM-optionsclose',
            value: 'Close',
        });
        closeButton.addEventListener("click", () => {
            container.remove();
            document.getElementById('KT-SETM-optionsbackground').remove();
        });

        container.append(footer);
        footer.append(saveButton, closeButton);
    }

    static SETM_OptionContainer(container, id, className) {
        let p = Object.assign(document.createElement('p'), {
            className: 'KT-SETM-setting-container',
            id: id || "",
            className: className || "",
        });
        container.append(p);
        return p;
    }

    static SETM_HardRule(container) {
        container.append(Object.assign(document.createElement('hr'), {
            className: 'big-hr',
        }));
    }

    static SETM_SpanInLine(container) {
        let span = Object.assign(document.createElement('span'), {
            className: 'optionlabel',
        });
        container.append(span);
        return span;
    }

}

class Main {
    constructor() {
        this.settings = this.loadSettings();
        this.initStyles();
        new SettingsManager();

        // check if reversi
        let bgColor = window.getComputedStyle(document.body).backgroundColor;
        let reversi = document.querySelector('.wrapper').classList.contains('KT-reversi');
        if ((bgColor == 'rgb(51, 51, 51)' && !reversi) || this.settings.reversi) {
            document.querySelector('.wrapper').classList.add('KT-reversi');
            LOADED_SETTINGS.reversi = true;
            DEBUG && console.log(`[Kat's Tweaks] Reversi Detected!`)
        }

    }

    // Load settings from the storage or fallback to default ones
    loadSettings() {
        const startTime = performance.now();
        let savedSettings = localStorage.getItem('KT-SavedSettings');

        if (savedSettings) {
            try {
                LOADED_SETTINGS = JSON.parse(savedSettings);
                DEBUG && console.log(`[Kat's Tweaks] Settings loaded successfully:`, savedSettings);
            } catch (error) {
                DEBUG && console.error(`[Kat's Tweaks] Error parsing settings: ${error}`);
                LOADED_SETTINGS = DEFAULT_SETTINGS
            }
        } else {
            LOADED_SETTINGS = DEFAULT_SETTINGS;
            DEBUG && console.warn(`[Kat's Tweaks] No saved settings found, using default settings.`, LOADED_SETTINGS);
        }

        const endTime = performance.now();
        DEBUG && console.log(`[Kat's Tweaks] Settings loaded in ${endTime - startTime} ms`);
        return LOADED_SETTINGS;
    }

    initStyles() {
        StyleManager.addStyle('SETM Default Style', `
#header .KT-SETM-menu-header {
    text-align: center !important;
    font-weight: bold;
}
#KT-SETM-optionsbox {
    position: fixed;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: min-content;
    width: 70%;
    max-height: 90%;
    max-width: 800px;
    margin: auto;
    overflow-y: auto;
    border: 10px solid #990000;
    box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, .2);
    padding: 0 20px;
    background-color: rgb(255, 255, 255);
    z-index: 999;
}
#KT-SETM-optionsbox hr.big-hr {
    border: 0;
    height: 1px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0), #990000, rgba(0, 0, 0, 0));
}
#KT-SETM-optionsbox p.actions {
    text-align: right
}
#KT-SETM-optionsbox p input[type="button"] {
    float: none;
    text-align: right;
}

#KT-SETM-optionsbox h1,
#KT-SETM-optionsbox h2 {
    text-align: center;
}
#KT-SETM-optionsbox input[type="button"] {
    height: auto;
    cursor: pointer;
}
#KT-SETM-optionsbox .optionlabel {
    display: inline-block;
    min-width: 13.5em;
}
.input-error{
    outline: 1px solid #990000 !important;
}
        `);

        StyleManager.addStyle('SETM Reversi Overrides', `
.KT-reversi #KT-SETM-optionsbox {
    border: 10px solid #5998D6;
    background-color: rgb(51, 51, 51);
}
.KT-reversi #KT-SETM-optionsbox hr.big-hr {
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0), #5998D6, rgba(0, 0, 0, 0));
}
.KT-reversi .input-error  {
    outline: 1px solid #5998D6 !important;
}
        `)
    }
}

new Main();