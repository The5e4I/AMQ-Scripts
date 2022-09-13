// ==UserScript==
// @name         draft
// @namespace    https://github.com/The5e4I
// @version      0
// @description  Adds a song list window, each song in the list is clickable for extra information
// @author       The5e4I
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @require      https://github.com/amq-script-project/AMQ-Scripts/raw/master/gameplay/amqAnswerTimesUtility.user.js
// @updateURL    FILL THIS IN

// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let listWindow;
let listWindowOpenButton;
let listWindowTable;

let infoWindow;

let settingsWindow;

// default settings
let savedSettings = {
    autoClearList: false,
    autoScroll: true,
    animeTitles: "romaji",
    songNumber: true,
    songName: true,
    artist: true,
    anime: true,
    annId: true,
    type: true,
    difficulty: true
};

function createListWindow() {
    let listCloseHandler = function () {
        infoWindow.close();
        settingsWindow.close();
        $(".rowSelected").removeClass("rowSelected");
    }
    listWindow = new AMQWindow({
        title: "Song List",
        width: 650,
        height: 480,
        minWidth: 480,
        minHeight: 350,
        zIndex: 1060,
        closeHandler: listCloseHandler,
        resizable: true,
        draggable: true
    });

    listWindow.addPanel({
        id: "listWindowOptions",
        width: 1.0,
        height: 65
    });

    listWindow.addPanel({
        id: "listWindowTableContainer",
        width: 1.0,
        height: "calc(100% - 65px)",
        position: {
            x: 0,
            y: 65
        },
        scrollable: {
            x: true,
            y: true
        }
    });

    // create the options tab
    listWindow.panels[0].panel
        .append($(`<button class="btn btn-default songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-trash-o"></i></button>`)
            .dblclick(() => {
                createNewTable();
            })
            .popover({
                placement: "bottom",
                content: "Clear List (double click)",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<button class="btn btn-default songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-gear"></i></button>`)
            .click(() => {
                if (settingsWindow.isVisible()) {
                    settingsWindow.close();
                }
                else {
                    settingsWindow.open();
                }
            })
            .popover({
                placement: "bottom",
                content: "Settings",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<input id="slSearch" type="text" placeholder="Search songs">`)
            .on("input", function (event) {
                applySearchAll();
            })
            .click(() => {
                quiz.setInputInFocus(false);
            })
        );

    // create results table
    listWindowTable = $(`<table id="listWindowTable" class="table floatingContainer"></table>`);
    listWindow.panels[1].panel.append(listWindowTable);

    // button to access the song results
    listWindowOpenButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-list-ol qpMenuItem"></i></div>`)
        .click(function () {
            if(listWindow.isVisible()) {
                $(".rowSelected").removeClass("rowSelected");
                listWindow.close();
                infoWindow.close();
                settingsWindow.close();
            }
            else {
                listWindow.open();
                autoScrollList();
            }
        })
        .popover({
            placement: "bottom",
            content: "Song List",
            trigger: "hover"
        });

    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append(listWindowOpenButton);

    listWindow.body.attr("id", "listWindowBody");
    addTableHeader();
    applyListStyle();
}

function createNewTable() {
    clearTable();
    addTableHeader();
}

function clearTable() {
    listWindowTable.children().remove();
}

function addTableHeader() {
    let header = $(`<tr class="header"></tr>`)
    let numberCol = $(`<td class="songNumber"><b>Number</b></td>`);
    let nameCol = $(`<td class="songName"><b>Song Name</b></td>`);
    let artistCol = $(`<td class="songArtist"><b>Artist</b></td>`);
    let animeEngCol = $(`<td class="animeNameEnglish"><b>Anime</b></td>`);
    let animeRomajiCol = $(`<td class="animeNameRomaji"><b>Anime</b></td>`);
    let annIdCol = $(`<td class="annId"><b>ANN ID</b></td>`);
    let typeCol = $(`<td class="songType"><b>Type<b></td>`);
    let diffCol = $(`<td class="difficulty"><b>Difficulty</b></td>`);

    if ($("#slShowSongNumber").prop("checked")) {
        numberCol.show();
    }
    else {
        numberCol.hide();
    }

    if ($("#slShowSongName").prop("checked")) {
        nameCol.show();
    }
    else {
        nameCol.hide();
    }

    if ($("#slShowArtist").prop("checked")) {
        artistCol.show();
    }
    else {
        artistCol.hide();
    }

    if ($("#slShowAnime").prop("checked")) {
        if ($("#slAnimeTitleSelect").val() === "english") {
            animeRomajiCol.hide();
        }
        if ($("#slAnimeTitleSelect").val() === "romaji") {
            animeEngCol.hide();
        }
    }
    else {
        animeRomajiCol.hide();
        animeEngCol.hide();
    }

    if ($("#slShowAnnId").prop("checked")) {
        annIdCol.show();
    }
    else {
        annIdCol.hide();
    }

    if ($("#slShowType").prop("checked")) {
        typeCol.show();
    }
    else {
        typeCol.hide();
    }

    if ($("#slShowDifficulty").prop("checked")) {
        diffCol.show();
    }
    else {
        diffCol.hide();
    }

    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeEngCol);
    header.append(animeRomajiCol);
    header.append(annIdCol);
    header.append(diffCol);
    listWindowTable.append(header);
}

function addTableEntry(newSong) {
    let newRow = $(`<tr class="songData clickAble"></tr>`)
        .click(function () {
            if (!$(this).hasClass("rowSelected")) {
                $(".rowSelected").removeClass("rowSelected");
                $(this).addClass("rowSelected");
                infoWindow.open();
                updateInfo(newSong);
            }
            else {
                $(".rowSelected").removeClass("rowSelected");
                infoWindow.close();
            }
        })
        .hover(function () {
            $(this).addClass("hover");
        }, function () {
            $(this).removeClass("hover");
        })

    let songNumber = $(`<td class="songNumber"></td>`).text(newSong.songNumber);
    let songName = $(`<td class="songName"></td>`).text(newSong.name);
    let artist = $(`<td class="songArtist"></td>`).text(newSong.artist);
    let animeEng = $(`<td class="animeNameEnglish"></td>`).text(newSong.anime.english);
    let animeRomaji = $(`<td class="animeNameRomaji"></td>`).text(newSong.anime.romaji);
    let annId = $(`<td class="annId"></td>`).text(newSong.annId);
    let type = $(`<td class="songType"></td>`).text(newSong.type);
    let difficulty = $(`<td class="samplePoint"></td>`).text(newSong.difficulty + (Number.isInteger(newSong.difficulty) ? "%" : ""));

    if ($("#slShowSongNumber").prop("checked")) {
        songNumber.show();
    }
    else {
        songNumber.hide();
    }

    if ($("#slShowSongName").prop("checked")) {
        songName.show();
    }
    else {
        songName.hide();
    }

    if ($("#slShowArtist").prop("checked")) {
        artist.show();
    }
    else {
        artist.hide();
    }

    if ($("#slShowAnime").prop("checked")) {
        if ($("#slAnimeTitleSelect").val() === "english") {
            animeRomaji.hide();
        }
        if ($("#slAnimeTitleSelect").val() === "romaji") {
            animeEng.hide();
        }
    }
    else {
        animeRomaji.hide();
        animeEng.hide();
    }

    if ($("#slShowAnnId").prop("checked")) {
        annId.show();
    }
    else {
        annId.hide();
    }

    if ($("#slShowType").prop("checked")) {
        type.show();
    }
    else {
        type.hide();
    }

    if ($("#slShowDifficulty").prop("checked")) {
        difficulty.show();
    }
    else {
        difficulty.hide();
    }

    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(animeEng);
    newRow.append(animeRomaji);
    newRow.append(annId);
    newRow.append(type);
    newRow.append(difficulty);
    listWindowTable.append(newRow);
    updateCorrect(newRow);
}

function applySearch(elem) {
    let searchQuery = $("#slSearch").val();
    let regexQuery = createAnimeSearchRegexQuery(searchQuery);
    let searchRegex = new RegExp(regexQuery, "i");
    applyRegex(elem, searchRegex);
}

function applySearchAll() {
    $("tr.songData").each((index, elem) => {
        applySearch(elem);
    });
}

function applyRegex(elem, searchRegex) {
    if (searchRegex.test($(elem).text())) {
        $(elem).show();
    }
    else {
        $(elem).hide();
    }
}

function createInfoWindow() {
    let closeInfoHandler = function () {
        $(".rowSelected").removeClass("rowSelected");
    }
    // create info window
    infoWindow = new AMQWindow({
        title: "Song Info",
        width: 450,
        height: 350,
        minWidth: 375,
        minHeight: 300,
        draggable: true,
        resizable: true,
        closeHandler: closeInfoHandler,
        zIndex: 1065,
        id: "infoWindow"
    });

    infoWindow.addPanel({
        height: 1.0,
        width: 1.0,
        scrollable: {
            x: false,
            y: true
        }
    });
}

function updateInfo(song) {
    clearInfo();
    let infoRow1 = $(`<div class="infoRow"></div>`);
    let infoRow2 = $(`<div class="infoRow"></div>`);
    let infoRow3 = $(`<div class="infoRow"></div>`);
    let infoRow4 = $(`<div class="infoRow"></div>`);
    let infoRow5 = $(`<div class="infoRow"></div>`);
    let infoRow6 = $(`<div class="infoRow"></div>`);

    let songNameContainer = $(`<div id="songNameContainer"><h5>
        <b>Song Name</b> <i class="fa fa-files-o clickAble" id="songNameCopy"></i></h5><p>${song.name}</p></div>`);
    let artistContainer = $(`<div id="artistContainer"><h5>
        <b>Artist</b> <i class="fa fa-files-o clickAble" id="artistCopy"></i></h5><p>${song.artist}</p></div>`);
    let animeEnglishContainer = $(`<div id="animeEnglishContainer"><h5>
        <b>Anime English</b> <i class="fa fa-files-o clickAble" id="animeEnglishCopy"></i></h5><p>${song.anime.english}</p></div>`);
    let animeRomajiContainer = $(`<div id="animeRomajiContainer"><h5>
        <b>Anime Romaji</b> <i class="fa fa-files-o clickAble" id="animeRomajiCopy"></i></h5><p>${song.anime.romaji}</p></div>`);
    let altTitlesContainer = $(`<div id="altTitlesContainer"><h5>
        <b>All Working Titles</b></h5><p style="margin-bottom: 0;">${song.altAnswers.join(`</p><p style="margin-bottom: 0;">`)}</p></div>`);
    let difficultyContainer = $(`<div id="difficultyContainer"><h5><b>Song Difficulty</b></h5><p>${song.difficulty}%</p></div>`);
    let typeContainer = $(`<div id="typeContainer"><h5><b>Type</b></h5><p>${song.type}</p></div>`);
    let annIdContainer = $(`<div id="annIdContainer"><h5 style="margin-bottom: 0;"><b>ANN ID: </b>${song.annId} <i class="fa fa-files-o clickAble" id="annIdCopy"></i></h5>
            <a target="_blank" href="https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${song.annId}">https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${song.annId}</a>
        </div>`);
    let animeInfoLinksContainer = $(`<div id="animeInfoLinksContainer"><h5><b>MAL/Anilist/Kitsu IDs</b></h5><p style="margin-bottom: 0;">`
        .concat(Number.isInteger(song.siteIds.malId) ? `</p>MAL ID: <a href="https://www.myanimelist.net/anime/${song.siteIds.malId}">${song.siteIds.malId}</a><p style="margin-bottom: 0;"` : ``)
        .concat(Number.isInteger(song.siteIds.aniListId) ? `</p>Anilist ID: <a href="https://www.anilist.co/anime/${song.siteIds.aniListId}">${song.siteIds.aniListId}</a><p style="margin-bottom: 0;">` : ``)
        .concat(Number.isInteger(song.siteIds.kitsuId) ? `</p>Kitsu ID: <a href="https://kitsu.io/anime/${song.siteIds.kitsuId}">${song.siteIds.kitsuId}</a><p style="margin-bottom: 0;">` : ``)
        .concat(`</p>`))
    let urlContainer = $(`<div id="urlContainer"><h5><b>URLs</b></h5></div>`);

    // row 1: song name, artist, type
    infoRow1.append(songNameContainer);
    infoRow1.append(artistContainer);
    infoRow1.append(typeContainer);

    // row 2: anime english, romaji
    infoRow2.append(animeEnglishContainer);
    infoRow2.append(animeRomajiContainer);

    // row 3: all alt titles
    infoRow3.append(altTitlesContainer);
    infoRow3.append(difficultyContainer);

    // row 4: URLs
    infoRow4.append(urlContainer);

    // row 5: ANN ID info and ANN URL
    infoRow5.append(annIdContainer);

    // row 6: other anime info site links
    infoRow6.append(animeInfoLinksContainer);

    let listContainer = $("<ul></ul>");
    for (let host in song.urls) {
        for (let resolution in song.urls[host]) {
            let url = song.urls[host][resolution];
            let innerHTML = "";
            innerHTML += host === "catbox" ? "Catbox " : "OpeningsMoe ";
            innerHTML += resolution === "0" ? "MP3: " : (resolution === "480" ? "480p: " : "720p: ");
            innerHTML += `<a href="${url}" target="_blank">${url}</a>`;
            listContainer.append($(`<li>${innerHTML}</li>`));
        }
    }
    urlContainer.append(listContainer);

    infoWindow.panels[0].panel.append(infoRow1);
    infoWindow.panels[0].panel.append(infoRow2);
    infoWindow.panels[0].panel.append(infoRow3);
    infoWindow.panels[0].panel.append(infoRow4);
    infoWindow.panels[0].panel.append(infoRow5);
    infoWindow.panels[0].panel.append(infoRow6);

    $("#songNameCopy").click(function () {
        $("#copyBox").val(song.name).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Song Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#artistCopy").click(function () {
        $("#copyBox").val(song.artist).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Artist",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#animeEnglishCopy").click(function () {
        $("#copyBox").val(song.anime.english).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy English Anime Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#animeRomajiCopy").click(function () {
        $("#copyBox").val(song.anime.romaji).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Romaji Anime Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#annIdCopy").click(function () {
        $("#copyBox").val(song.annId).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy ANN ID",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });
}

function clearInfo() {
    infoWindow.panels[0].clear();
}

function createSettingsWindow() {
    settingsWindow = new AMQWindow({
        width: 400,
        height: 320,
        title: "Settings",
        draggable: true,
        zIndex: 1070
    });
    settingsWindow.addPanel({
        width: 1.0,
        height: 130,
        id: "slListSettings"
    });
    settingsWindow.addPanel({
        width: 1.0,
        height: 160,
        position: {
            x: 0,
            y: 135
        },
        id: "slTableSettings"
    });

    settingsWindow.panels[0].panel
        .append($(`<div class="slListDisplaySettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>List Settings</b></span>`))
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slAutoClear' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            savedSettings.autoClearList = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slAutoClear'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Auto Clear List</label>")
                    .popover({
                        content: "Automatically clears the list on quiz start, quiz end or when leaving the lobby",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slAutoScroll' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            savedSettings.autoScroll = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slAutoScroll'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Auto Scroll</label>")
                    .popover({
                        content: "Automatically scrolls to the bottom of the list on each new entry added",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
        )

        .append($(`<div id="slAnimeTitleSettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>Anime Titles</b></span>`))
            .append($(`<select id="slAnimeTitleSelect"></select>`)
                .append($(`<option value="english">English</option>`))
                .append($(`<option value="romaji" selected>Romaji</option>`))
                .change(function () {
                    if ($("#slShowAnime").prop("checked")) {
                        if ($(this).val() === "romaji") {
                            $(".animeNameRomaji").show();
                            $(".animeNameEnglish").hide();
                        }
                        if ($(this).val() === "english") {
                            $(".animeNameRomaji").hide();
                            $(".animeNameEnglish").show();
                        }
                    }
                    else {
                        $(".animeNameRomaji").hide();
                        $(".animeNameEnglish").hide();
                    }
                    savedSettings.animeTitles = $(this).val();
                    saveSettings();
                })
            )
        )

        .append($(`<div id="slListStyleSettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>List Style</b></span>`))
            .append($(`<select id="slListStyleSelect"></select>`)
                .append($(`<option value="compact">Compact</option>`))
                .append($(`<option value="standard" selected>Standard</option>`))
                .change(function () {
                    applyListStyle();
                    savedSettings.listStyle = $(this).val();
                    saveSettings();
                })
            )
        )

    settingsWindow.panels[1].panel
        .append($(`<span style="width: 100%; text-align: center;display: block;"><b>Table Display Settings</b></span>`))
        .append($(`<div class="slTableSettingsContainer"></div>`)
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowSongNumber' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".songNumber").show();
                            }
                            else {
                                $(".songNumber").hide();
                            }
                            savedSettings.songNumber = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowSongNumber'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Song Number</label>"))
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowSongName' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".songName").show();
                            }
                            else {
                                $(".songName").hide();
                            }
                            savedSettings.songName = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowSongName'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Song Name</label>"))
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowArtist' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".songArtist").show();
                            }
                            else {
                                $(".songArtist").hide();
                            }
                            savedSettings.artist = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowArtist'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Artist</label>"))
            )
        )
        .append($(`<div class="slTableSettingsContainer"></div>`)
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowAnime' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                if ($("#slAnimeTitleSelect").val() === "romaji") {
                                    $(".animeNameEnglish").hide();
                                    $(".animeNameRomaji").show();
                                }
                                if ($("#slAnimeTitleSelect").val() === "english") {
                                    $(".animeNameEnglish").show();
                                    $(".animeNameRomaji").hide();
                                }
                            }
                            else {
                                $(".animeNameEnglish").hide();
                                $(".animeNameRomaji").hide();
                            }
                            savedSettings.anime = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowAnime'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Anime</label>"))
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowAnnId' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".annId").show();
                            }
                            else {
                                $(".annId").hide();
                            }
                            savedSettings.annId = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowAnnId'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>ANN ID</label>"))
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowType' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".songType").show();
                            }
                            else {
                                $(".songType").hide();
                            }
                            savedSettings.type = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowType'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Type</label>"))
            )

        )
        .append($(`<div class="slTableSettingsContainer"></div>`)
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowDifficulty' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".difficulty").show();
                            }
                            else {
                                $(".difficulty").hide();
                            }
                            savedSettings.samplePoint = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowDifficulty'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Difficulty</label>"))
            )
        )
}

// save settings to local storage
function saveSettings() {
    localStorage.setItem("songListSettings", JSON.stringify(savedSettings));
}

// load settings from local storage
function loadSettings() {
    // load settings, if nothing is loaded, use default settings
    let loadedSettings = localStorage.getItem("songListSettings");
    if (loadedSettings !== null) {
        const oldSavedSettings = JSON.parse(loadedSettings); // replaces the object and deletes the key
        Object.keys(oldSavedSettings).forEach((key) => {savedSettings[key] = oldSavedSettings[key];});
        // If the key wasn't added yet, do so here
        if(Object.keys(savedSettings).length > Object.keys(oldSavedSettings).length){
            saveSettings();
        }
    updateSettings();
    }
}

// update settings after loading
function updateSettings() {
    $("#slAutoClear").prop("checked", savedSettings.autoClearList);
    $("#slAutoScroll").prop("checked", savedSettings.autoScroll);
    $("#slAnimeTitleSelect").val(savedSettings.animeTitles === undefined ? "romaji" : savedSettings.animeTitles);
    $("#slListStyleSelect").val(savedSettings.listStyle === undefined ? "standard" : savedSettings.listStyle);
    $("#slShowSongNumber").prop("checked", savedSettings.songNumber);
    $("#slShowSongName").prop("checked", savedSettings.songName);
    $("#slShowArtist").prop("checked", savedSettings.artist);
    $("#slShowAnime").prop("checked", savedSettings.anime);
    $("#slShowAnnId").prop("checked", savedSettings.annId);
    $("#slShowType").prop("checked", savedSettings.type);
    $("#slShowDifficulty").prop("checked", savedSettings.difficulty);
}

function applyListStyle() {
    $("#listWindowTable").removeClass("compact");
    $("#listWindowTable").removeClass("standard");
    $("#listWindowTable").addClass($("#slListStyleSelect").val());
}

function autoScrollList() {
    if ($("#slAutoScroll").prop("checked")) {
        $("#listWindowTableContainer").scrollTop($("#listWindowTableContainer").get(0).scrollHeight);
    }
}

function setup() {
    // reset song list for the new round
    let quizReadyListener = new Listener("quiz ready", (data) => {
        if ($("#slAutoClear").prop("checked")) {
            createNewTable();
        }
    });

    // request server for song info
    // listen for new song link loading
    let mp3RequestListener = new Listener("LINK REQUESTED", (result) => {
        // extract song link
        // request to server
    };

    // retrieve song data from server
    let answerResultsListener = new Listener("PAYLOAD ARRIVES", (payload) => {
    	setTimeout(() => {

	        let newSong = {
	            gameMode: quiz.gameMode,
	            name: payload.songInfo.songName,
	            artist: payload.songInfo.artist,
	            anime: payload.songInfo.animeNames,
	            annId: payload.songInfo.annId,
	            songNumber: $("#qpCurrentSongCount").text() ? parseInt($("#qpCurrentSongCount").text()) + 1 : 1,
	            type: payload.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
	            urls: payload.songInfo.urlMap,
	            siteIds: payload.songInfo.siteIds,
	            difficulty: typeof payload.songInfo.animeDifficulty === "string" ? "Unrated" : payload.songInfo.animeDifficulty.toFixed(1),
	            animeType: payload.songInfo.animeType,
	            animeScore: payload.songInfo.animeScore,
	            vintage: payload.songInfo.vintage,
	            tags: payload.songInfo.animeTags,
	            genre: payload.songInfo.animeGenre,
	            altAnswers: [...new Set(payload.songInfo.altAnimeNames.concat(payload.songInfo.altAnimeNamesAnswers))],
	        addTableEntry(newSong);
	        exportData.push(newSong);
                }
        },0);
    });

    // reset table on next song and send song data to server
    let quizOverListener = new Listener("SONG OVER? NEW SONG?", (roomSettings) => {
        if ($("#slAutoClear").prop("checked")) {
            createNewTable();
        }

        // send data to server
    });

    // triggers when loading rooms in the lobby, this is to detect when a player leaves the lobby to reset the song list table
    let quizLeaveListener = new Listener("New Rooms", (rooms) => {
        if ($("#slAutoClear").prop("checked")) {
            createNewTable();
        }
    });

    quizReadyListener.bindListener();
    mp3RequestListener.bindListener();
    answerResultsListener.bindListener();
    quizOverListener.bindListener();
    quizLeaveListener.bindListener();
    

    createSettingsWindow();
    loadSettings();
    createInfoWindow();
    createListWindow();

    // lowers the z-index when a modal window is shown so it doesn't overlap
    $(".modal").on("show.bs.modal", () => {
        listWindow.setZIndex(1030);
        infoWindow.setZIndex(1035);
        settingsWindow.setZIndex(1040);
    });

    $(".modal").on("hidden.bs.modal", () => {
        listWindow.setZIndex(1060);
        infoWindow.setZIndex(1065);
        settingsWindow.setZIndex(1070);
    });

    // lowers the z-index when hovering over a label
    $(".slCheckbox label").hover(() => {
        listWindow.setZIndex(1030);
        infoWindow.setZIndex(1035);
        settingsWindow.setZIndex(1040);
    }, () => {
        listWindow.setZIndex(1060);
        infoWindow.setZIndex(1065);
        settingsWindow.setZIndex(1070);
    });

    // Auto scrolls the list on new entry added
    document.getElementById("listWindowTable").addEventListener("DOMNodeInserted", function() {
        autoScrollList();
    });

    // Add metadata
    AMQ_addScriptData({
        name: "Song Checker",
        author: "The5e4I",
        description: `
            <p>Creates a window which includes the song list table with song info such as song name, artist and the anime it's from</p>
        `
    });

    // CSS
    AMQ_addStyle(`
        #listWindowTableContainer {
            padding: 15px;
        }
        #slAnimeTitleSelect {
            color: black;
            font-weight: normal;
            width: 75%;
            margin-top: 5px;
            border: 1px;
            margin-right: 1px;
        }
        #listWindowOptions {
            border-bottom: 1px solid #6d6d6d;
        }
        #slListSettings {
            padding-left: 10px;
            padding-top: 5px;
        }
        #slAnimeTitleSettings {
            text-align: center;
            font-weight: bold;
        }
        .slTableSettingsContainer {
            padding-left: 10px;
            width: 33%;
            float: left;
        }
        .songListOptionsButton {
            float: right;
            margin-top: 15px;
            margin-right: 10px;
            padding: 6px 8px;
        }
        .slListDisplaySettings {
            width: 33%;
            float: left;
        }
        #slAnimeTitleSettings {
            width: 33%;
            float: left;
        }
        #slListStyleSelect {
            width: 75%;
            margin-top: 5px;
            color: black;
            border: 1px;
            margin-right: 1px;
        }
        #slListStyleSettings {
            width: 33%;
            float: left;
            text-align: center;
        }
        #slSearch {
            width: 200px;
            color: black;
            margin: 15px 15px 0px 15px;
            height: 35px;
            border-radius: 4px;
            border: 0;
            text-overflow: ellipsis;
            padding: 5px;
            float: left;
        }
        .slFilterContainer {
            padding-top: 4px;
            padding-bottom: 4px;
        }
        .rowFiltered {
            display: none !important;
        }
        .standard .songData {
            height: 50px;
        }
        .songData > td {
            vertical-align: middle;
            border: 1px solid black;
            text-align: center;
        }
        .songData.guessHidden {
            background-color: rgba(0, 0, 0, 0);
        }
        .songData.hover {
            box-shadow: 0px 0px 10px cyan;
        }
        .songData.rowSelected {
            box-shadow: 0px 0px 10px lime;
        }
        .standard .songNumber {
            min-width: 60px;
        }
        .standard .songName {
            min-width: 85px;
        }
        .standard .songType {
            min-width: 80px;
        }
        .standard .annId {
            min-width: 60px;
        }
        .standard .header {
            height: 30px;
        }
        .compact .header {
            height: 20px;
        }
        .compact .songData {
            height: 20px;
        }
        .compact .songData > td {
            vertical-align: middle;
            border: 1px solid black;
            text-align: center;
            text-overflow: ellipsis;
            overflow: hidden;
            padding: 0px 5px;
            white-space: nowrap;
            font-size: 14px;
            line-height: 1;
        }
        .compact .songNumber {
            max-width: 35px;
        }
        .compact .songName {
            max-width: 85px;
        }
        .compact .songArtist {
            max-width: 85px;
        }
        .compact .animeNameEnglish {
            max-width: 85px;
        }
        .compact .animeNameRomaji {
            max-width: 85px;
        }
        .compact .annId {
            max-width: 65px;
        }
        .compact .songType {
            max-width: 85px;
        }
        .header > td {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
        }
        .compact .header > td {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
        .infoRow {
            width: 98%;
            height: auto;
            text-align: center;
            clear: both;
        }
        .infoRow > div {
            margin: 1%;
            text-align: center;
            float: left;
        }
        #songNameContainer {
            width: 38%;
            overflow-wrap: break-word;
        }
        #artistContainer {
            width: 38%;
            overflow-wrap: break-word;
        }
        #typeContainer {
            width: 18%;
        }
        #animeEnglishContainer {
            width: 38%;
            overflow-wrap: break-word;
        }
        #animeRomajiContainer {
            width: 38%;
            overflow-wrap: break-word;
        }
        #altTitlesContainer {
            width: 78%;
            overflow-wrap: break-word;
        }
        #difficultyContainer {
            width: 18%;
        }
        #urlContainer {
            width: 100%;
        }
        #annIdContainer {
            width: 100%;
        }
        #animeInfoLinksContainer {
            width: 100%;
        }
        #qpOptionContainer {
            z-index: 10;
        }
        #qpSongListButton {
            width: 30px;
            height: 100%;
            margin-right: 5px;
        }
        .slCheckboxContainer {
            width: 130px;
            float: right;
            user-select: none;
        }
        .slCheckbox {
            display: flex;
            margin: 5px;
        }
        .slCheckbox > label {
            font-weight: normal;
            margin-left: 5px;
        }
        .slFilterContainer > .customCheckbox {
            float: left;
        }
    `);

    // Open the song list with pause/break key
    $(document.documentElement).keydown(function (event) {
        if (event.which === 19) {
            if (listWindow.isVisible()) {
                $(".rowSelected").removeClass("rowSelected");
                listWindow.close();
                infoWindow.close();
                settingsWindow.close();
            }
            else {
                listWindow.open();
                autoScrollList();
            }
        }
    });
}
