/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

 var ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var game, stager;

    game = gameRoom.getClientType('player');
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
                        var _cb, stepObj, stepId;
                        var id;

                        stepObj = this.getCurrentStepObj();
                        stepId = stepObj.id

                        _cb = stepObj._roles[this.role];
                        _cb.call(this);

                        if ((stepId === 'red-choice-tutorial' &&
                             node.game.role === 'RED') ||
                            (stepId === 'blue-choice-tutorial' &&
                             node.game.role === 'BLUE')) {

                            // Id of the button to press.
                            id = node.game.tutorialChoices[node.game.role];
                            id = id.toLowerCase();

                            // Wait a bit, the button is still hidden.
                            setTimeout(function() {
                                W.getElementById(id).click();
                            }, 2000);

                        }
                        else {
                            node.timer.randomDone(2000);
                        }
                    }
                }
            }
        }
        else {
            o._cb = o.cb;
            o.cb = function() {
                var _cb, stepObj, stepId;
                var tmp;

                stepObj = this.getCurrentStepObj();
                stepId = stepObj.id

                _cb = stepObj._cb;
                _cb.call(this);

                if (stepId === 'choose-tutorial') {
                    tmp = Math.random() > 0.5 ? 'RED' : 'BLUE';
                    node.game.selecttutorialRole(tmp);
                }
                else {
                    node.timer.randomDone(2000);
                }
            };
        }
        return o;
    });

    game.plot = stager.getState();
    return game;
};
