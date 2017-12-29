/**
 * # Game settings definition file
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * The variables in this file will be sent to each client and saved under:
 *
 *   `node.game.settings`
 *
 * The name of the chosen treatment will be added as:
 *
 *    `node.game.settings.treatmentName`
 *
 * http://www.nodegame.org
 * ---
 */
var settings;

settings = {

    // Variables shared by all treatments.

    // #nodeGame properties:

    /**
     * ### TIMER (object) [nodegame-property]
     *
     * Maps the names of the steps of the game to timer durations
     *
     * If a step name is found here, then the value of the property is
     * used to initialize the game timer for the step.
     */
    TIMER: {
        'instructions-light': 30000,
        'blue-choice': 45000,
        'red-choice': 45000,
        'results': 12000
        // instructions: 60000
    },

    // bidTime: 60000,
    bidTime: 2000,

    // # Game specific properties

    // Number of game rounds repetitions in practice.
    REPEAT_PRACTICE: 3,

    tutorial: [
        {
            RED: 'GO',
            BLUE: 'LEFT'
        },
        {
            RED: 'GO',
            BLUE: 'RIGHT'
        },
        {
            RED: 'STOP',
            BLUE: 'RIGHT' // eventually make it use RANDOM as a keyword
        }
    ],

    // Number of game rounds repetitions.
    REPEAT: 3,


    botChance: {
        stop: 0.5, // default bot chance
        right: 0.5,
        minDecisions: 10
    },

    EXCHANGE_RATE: 0.125,

    // # Treatments definition.

    // They can contain any number of properties, and also overwrite
    // those defined above.

    // If the `treatments` object is missing a treatment named _standard_
    // will be created automatically, and will contain all variables.

    treatments: {

        original: {
            fullName: "A=3.33 and PI=0.5",
            description: "As in original EGLML paper",
            // Probability of state of the world is A.
            PI: 0.5,
            // Payoff in first leaf.
            TWO: 6,
            // Payoff in second leaf.
            A: 10,
            // Payoff if Player 1 chooses stop.
            STOP: 3
        },

        A2_PI05: {
            fullName: "A=2 and PI=0.5",
            description: "none",
            STOP: 3,
            TWO: 6,
            A: 6,
            PI: 0.5
        },

        A6_PI05: {
            fullName: "A=6 and PI=0.5",
            description: "none",
            STOP: 3,
            TWO: 6,
            A: 18,
            PI: 0.5
        },

        A6_PI02: {
            fullName: "A=6 and PI=0.2",
            description: "none",
            STOP: 3,
            TWO: 6,
            A: 18,
            PI: 0.2
        },

        A6_PI08: {
            fullName: "A=6 and PI=0.8",
            description: "none",
            STOP: 3,
            TWO: 6,
            A: 18,
            PI: 0.8
        }
    }
};

// Create a proper payoffs object in each treatment.
(function(settings) {
    var mult, t;
    mult = settings.multiplier;
    for (t in settings.treatments) {
        if (settings.treatments.hasOwnProperty(t)) {
            t = settings.treatments[t];
            // 1 - PI.
            t.PIB = parseFloat((1-t.PI).toFixed(2));
            t.payoffs = {
    	        STOP: {
                    RED:  t.STOP,
    	            BLUE: t.STOP
    	        },
    	        GO: {
    	            A: {
                        LEFT: {
                            RED:  0,
                            BLUE: t.TWO
                        },
                        RIGHT: {
                            RED:  t.A,
                            BLUE: 0
                        }
    	            },
    	            B: {
                        LEFT: {
                            RED:  t.TWO,
                            BLUE: 0
                        },
                        RIGHT: {
                            RED:  0,
                            BLUE: t.A
                        }
    	            }
    	        }
            };
        }
    }
})(settings);

module.exports = settings;
