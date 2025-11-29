// ==UserScript==
// @name         multi box fix
// @namespace    tbd
// @version      0.1
// @description  remove boxes for games with more than 8 players
// @match        https://*.animemusicquiz.com/*
// @grant        none
// @downloadURL  https://github.com/The5e4I/AMQ-Scripts/raw/master/multi_box_fix.user.js
// @updateURL    https://github.com/The5e4I/AMQ-Scripts/raw/master/multi_box_fix.user.js
// ==/UserScript==

/*
AMQ handles multiple boxes by hiding all players not in the currently selected box
To save screen space, avatar image is removed
After removing the avatar image, the guess textbox overlaps with the name box, so css is used to keep them separate

existing bugs:
- avatar row only shows all names after someone types something and resets every answer reveal (and new round?)
- avatar container height cannot be changed? might need to look into how height is calculated in the source
*/

(() => {
    'use strict';

    // separate guess textbox from name box
    const css = `
        .qpAvatarContainer > .qpAvatarAnswerContainer { margin-bottom: 25px !important; }
        .qpAvatarContainer > .qpAvatarInfoBarOuter { margin-top: 25px !important; }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // container routine
    const cleanContainer = container => {
        const targetIcon = container.querySelector('.qpAvatarTargetIconContainer');
        const swapIcon = container.querySelector('.qpAvatarSwapIconContainer');
        const image = container.querySelector('.qpAvatarImageContainer');

        // hide avatar image
        for (const item of [targetIcon, swapIcon, image]) {
            if (!!item) {
                item.style.display = 'none';
                // item.remove();
            }
        }

        // unhide players from unselected boxes
        container.classList.remove('hide');
    };

    // reduce scope of mutation detection
    const avatarRowParent = document.getElementById('qpAvatarRowAvatarContainer');
    const scoreBoardParent = document.getElementById('qpStandingContainer');
    if (!avatarRowParent || !scoreBoardParent) {
        return;
    }

    // observers
    const avatarRowObserver = new MutationObserver(mutations => {
        for (const mut of mutations) {
            console.log(mut);

            mut.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                // call container routine
                node.querySelectorAll('.qpAvatarContainer').forEach(cleanContainer);
            });
        }
        // reduce container height
        avatarRowParent.style.height /= 2 // doesn't work?
    });
    const scoreBoardObserver = new MutationObserver(mutations => {
        const scoreBoards = document.querySelectorAll('.qpScoreBoardGroupContainer')
        if (scoreBoards.length > 1) {
            // unhide players from unselected boxes
            document.querySelectorAll('.qpAvatarContainerOuter.hide').forEach(el => el.classList.remove('hide'));
        }
    });

    avatarRowObserver.observe(avatarRowParent, { childList: true, subtree: true });
    scoreBoardObserver.observe(scoreBoardParent, { childList: true, subtree: true });

    // best practice (?)
    window.addEventListener('beforeunload', () => {
        avatarRowObserver.disconnect();
        scoreBoardObserver.disconnect();
    });
})();
