// ==UserScript==
// @name         AMQ Japanese MCQ Options
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Replace multiple choice options with Japanese text
// @author       The5e4I
// @match        https://animemusicquiz.com/*
// @grant        none

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

const url = 'https://graphql.anilist.co';

const query = `
        query ($title: String) {
          Media (search: $title, type: ANIME) {
            title {
              native
            }
          }
        }`;

function setup() {
    let nextSongListener = new Listener("play next song", (payload) => {
        if (payload.multipleChoiceNames) {
            let optionsMCQ = document.getElementsByClassName("qpMultipleChoiceEntryText")
            payload.multipleChoiceNames.forEach((item, index) => {
                let options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            query: query,
                            variables: {
                                title: item.romaji // english or romaji
                            }
                        })
                    };

                fetch(url, options).then(handleResponse)
                    .then(handleData)
                    .catch(handleError);

                function handleResponse(response) {
                    return response.json().then(function (json) {
                        return response.ok ? json : Promise.reject(json);
                    });
                }

                function handleData(data) {
                    optionsMCQ[index].textContent = data.data.Media.title.native;
                }

                function handleError(error) {
                    console.error("MCQ error", error);
                }
            });
    }}).bindListener();
}
