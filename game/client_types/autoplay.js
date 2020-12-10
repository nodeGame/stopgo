/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

const ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;
    let node = gameRoom.node;

    let game = gameRoom.getClientType('player');
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        var role;
        if (o.roles) {
            o._roles = {};
            for (role in o.roles) {
                if (o.roles.hasOwnProperty(role)) {
                    // Copy only cb property.
                    o._roles[role] = o.roles[role].cb;
                    // Make a new one.
                    o.roles[role].cb = function() {

                        let stepObj = this.getCurrentStepObj();
                        let stepId = stepObj.id
                        let _cb = stepObj._roles[this.role];
                        _cb.call(this);

                        if ((stepId === 'red-choice-tutorial' &&
                             node.game.role === 'RED') ||
                            (stepId === 'blue-choice-tutorial' &&
                             node.game.role === 'BLUE')) {

                            // Id of the button to press.
                            let id = node.game.tutorialChoices[node.game.role];
                            id = id.toLowerCase();

                            // Wait a bit, the button is still hidden.
                            node.timer.setTimeout(function() {
                                W.getElementById(id).click();
                            }, 2000);

                        }
                        else {
                            node.timer.random(2000).done();
                        }
                    }
                }
            }
        }
        else {
            o._cb = o.cb;
            o.cb = function() {

                let stepObj = this.getCurrentStepObj();
                let stepId = stepObj.id

                let _cb = stepObj._cb;
                _cb.call(this);

                if (stepId === 'choose-tutorial') {
                    let tmp = Math.random() > 0.5 ? 'RED' : 'BLUE';
                    node.game.selecttutorialRole(tmp);
                }
                else {
                    node.timer.random(2000).done();
                }
            };
        }
        return o;
    });

    game.plot = stager.getState();
    return game;
};
