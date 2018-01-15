/**
 * # Autoplay implementation of the game stages
 * Copyright(c) Stefano Balietti 2017
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;
    var ngc =  require('nodegame-client');

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
                        var rndButtonId;

                        stepObj = this.getCurrentStepObj();
                        stepId = stepObj.id

                        _cb = stepObj._roles[this.role];
                        _cb.call(this);

                        if (stepId === 'red-choice') {
                            if (node.game.role === 'RED') {

                                // Wait a bit, the button is still hidden.
                                setTimeout(function() {
                                    rndButtonId = Math.floor(Math.random()*2) ?
                                        'stop':'go';
                                    W.getElementById(rndButtonId).click();
                                    // Disconnect Test.
                                    // if (node.game.getRound() === 2) {
                                    // node.socket.disconnect();
                                    // }
                                }, 2000);
                            }
                        }
                        else if (stepId === 'blue-choice') {
                            if (node.game.role === 'BLUE') {

                                // Wait a bit, the button is still hidden.
                                setTimeout(function() {
                                    rndButtonId = Math.floor(Math.random()*2) ?
                                        'left':'right';
                                    W.getElementById(rndButtonId).click();
                                    // Disconnect Test.
                                    // if (node.game.getRound() === 2) {
                                    // node.socket.disconnect();
                                    // }
                                }, 2000);
                            }
                        }

                    }
                }
            }
        }
        else {
            o._cb = o.cb;
            o.cb = function() {
                var _cb, stepObj, stepId;
                stepObj = this.getCurrentStepObj();
                stepId = stepObj.id

                _cb = stepObj._cb;
                _cb.call(this);

                // Disconnect Test.
                // if (this.getRound() === 2 && stepId === 'results') {
                //     this.node.socket.disconnect();
                //     return;
                // }

                if (stepId !== 'end') {
                    node.timer.randomDone(2000);
                }
            };
        }
        return o;
    });

    game.plot = stager.getState();

    return game;
};
