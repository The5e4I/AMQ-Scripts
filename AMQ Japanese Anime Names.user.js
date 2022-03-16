// ==UserScript==
// @name         AMQ Japanese Anime Names
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fetch Japanese Anime Name from Anilist and replace in AMQ during answer reveal phase
// @author       The5e4I
// @match        https://animemusicquiz.com/*
// @grant        none

// ==/UserScript==

let answerResults;

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
    // stuff to do on answer reveal
    answerResults = new Listener("answer results", (result) => {

        let animeID = result.songInfo.siteIds.aniListId;

        let variables = {
            id: animeID
        };

        let query = `
        query ($id: Int) { # Define which variables will be used in the query (id)
          Media (id: $id, type: ANIME) {
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
            document.getElementById("qpAnimeName").textContent = animeTitleJapanese;
        }

        function handleError(error) {
            alert('Error, check console');
            console.error(error);
        }


    });
    answerResults.bindListener();
}