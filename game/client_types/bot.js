/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    stager.setDefaultStepRule(stepRules.SOLO);

    
    stager.setDefaultCallback(function() {
        console.log('Stage: ' , this.getCurrentGameStage());
        this.node.timer.randomDone();
    });

    stager.extendStep('red-choice-tutorial', {
        role: function() { return Math.random() > 0.5 ? 'RED' : 'BLUE'; },
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
        done: function() {
            node.say('tutorial-over');
        }
    });
};
