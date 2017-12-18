/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    var game;
    game = {};
    game.nodename = 'bot';

    stager.setDefaultCallback(function() {
        console.log('Stage: ' , that.getCurrentGameStage());
        this.node.timer.randomDone();
    });

    stager.extendStep('red-choice-tutorial', {
        roles: {
            RED: {
                cb: function() {
                    this.node.timer.randomDone();
                }
            },
            BLUE: {
                cb: function() {
                    this.node.timer.randomDone();
                }
            }
        }
    });

    stager.extendStep('blue-choice-tutorial', {
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    this.node.timer.randomDone();
                }
            },
            BLUE: {
                cb: function() {
                    this.node.timer.randomDone();
                }
            }
        }
    });
    
    stager.extendStep('tutorial-end', {
        cb: function() {
            this.node.done('tutorial-over');
        }
    });

    stager.extendStep('results-tutorial', {
        cb: function() {
            this.node.timer.randomDone();            
        }
    });

    game.plot = stager.getState();

    return game;
};
