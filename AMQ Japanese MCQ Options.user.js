// ==UserScript==
// @name         AMQ Japanese MCQ Options
// @namespace    http://tampermonkey.net/
// @version      0.1
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

function setup() {
    let nextSongListener = new Listener("play next song", (payload) => {
        let optionsMCQ = document.getElementsByClassName("qpMultipleChoiceEntryText")
        payload.multipleChoiceNames.forEach((item, index) => {
            let variables = {
                title: item.english
            };
            let query = `
        query ($title: String) {
          Media (search: $title, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
          }
        }`;
            let url = 'https://graphql.anilist.co',
                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        variables: variables
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
                let animeTitleJapanese = data.data.Media.title.native;
                optionsMCQ[index].textContent = animeTitleJapanese;
            }

            function handleError(error) {
                console.error("MCQ error", error);
            }
        });
    }).bindListener();
}
