/**
 * # Autoplay implementation of the game stages
 * Copyright(c) Stefano Balietti 2017
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

const ngc =  require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;

    let game = gameRoom.getClientType('player');
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        if (o.roles) {
            o._roles = {};
            for (let role in o.roles) {
                if (o.roles.hasOwnProperty(role)) {
                    // Copy only cb property.
                    o._roles[role] = o.roles[role].cb;
                    // Make a new one.
                    o.roles[role].cb = function() {
                        let stepObj = this.getCurrentStepObj();
                        let stepId = stepObj.id
                        let _cb = stepObj._roles[this.role];
                        _cb.call(this);

                        if (stepId === 'red-choice') {
                            if (node.game.role === 'RED') {

                                // Wait a bit, the button is still hidden.
                                node.timer.setTimeout(function() {
                                    let rndButtonId = Math.random() > 0.5 ?
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
                                node.timer.setTimeout(function() {
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
                let stepObj = this.getCurrentStepObj();
                let stepId = stepObj.id
                let _cb = stepObj._cb;
                _cb.call(this);

                // Disconnect Test.
                // if (this.getRound() === 2 && stepId === 'results') {
                //     this.node.socket.disconnect();
                //     return;
                // }

                if (stepId !== 'end') {
                    node.timer.random(2000).done();
                }
            };
        }
        return o;
    });

    game.plot = stager.getState();

    return game;
};
