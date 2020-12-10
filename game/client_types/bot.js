/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

const ngc = require('nodegame-client');
const stepRules = ngc.stepRules;

module.exports = function(treatmentName, settings, stager,
                          setup, gameRoom, node) {

    let channel = gameRoom.channel;
    let logic = gameRoom.node;

    stager.setDefaultStepRule(stepRules.SOLO);


    stager.setDefaultCallback(function() {
        console.log('Stage: ' , this.getCurrentGameStage());
        node.timer.random.done();
    });

    stager.extendStep('red-choice-tutorial', {
        role: function() { return Math.random() > 0.5 ? 'RED' : 'BLUE'; },
        roles: {
            RED: {
                cb: function() {
                    node.timer.random.done();
                }
            },
            BLUE: {
                cb: function() {
                    node.timer.random.done();
                }
            }
        }
    });

    stager.extendStep('blue-choice-tutorial', {
        role: function() { return this.role; },
        roles: {
            RED: {
                cb: function() {
                    node.timer.random.done();
                }
            },
            BLUE: {
                cb: function() {
                    node.timer.random.done();
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
