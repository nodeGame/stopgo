/**
 * # Player type implementation of the game stages
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * Each client type must extend / implement the stages defined in `game.stages`.
 * Upon connection each client is assigned a client type and it is automatically
 * setup with it.
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var publishLevels = constants.publishLevels;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    stager.setOnInit(function() {

        // Initialize the client.

        var header, frame;

        // Setup page: header + frame.
        header = W.generateHeader();
        frame = W.generateFrame();

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);

        this.doneButton = node.widgets.append('DoneButton', header);

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm'
    });

    stager.extendStep('stoporgo', {
        donebutton: false,
        frame: 'stopgostep.htm',
        cb: function() {

            node.on.data('ROLE_RED', function(msg) {
                var buttonStop, buttonGo, offer, div;

                // Make the RED div display visible.
                div = W.getElementById('red').style.display = '';
                buttonStop = W.getElementById('stop');
                buttonGo = W.getElementById('go');
                
                buttonStop.onclick = function() {
                	node.done('stop');
                };
                
                
                buttonGo.onclick = function() {
                	node.done('go');
                };
                
                // Setup the timer.
                node.game.visualTimer.init({
                    milliseconds: node.game.settings.bidTime,
                    timeup: function() {
                        node.game.randomOffer(offer, button);
                    }
                });
                
                node.game.visualTimer.updateDisplay();
                node.game.visualTimer.startTiming();
            });

            node.on.data('ROLE_BLUE', function(msg) {
                var button, span, offer, div;

                node.game.visualTimer.clear();
                node.game.visualTimer.startWaiting({
                    milliseconds: node.game.settings.bidTime,
                    timeup: false
                });

                // Make the observer display visible.
                div = W.getElementById('blue').style.display = '';
                span = W.getElementById('dots');
                W.addLoadingDots(span);
            });
        }
    });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
