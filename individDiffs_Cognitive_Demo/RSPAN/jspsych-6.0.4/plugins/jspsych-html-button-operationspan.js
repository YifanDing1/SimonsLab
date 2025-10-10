jsPsych.plugins["letter rotation"] = (function() {

  var plugin = {};
  var choice;
  var accuracy_sequence = [];
  var response_sequence = [];
  var letter_sequence = [];
  var rotation_sequence = []; // Array to store whether letters are flipped (mirrored) or not
  var previousN = -1;
  var nCorrectRotation = 0;
  var nRotationProblems = 0;

  // Add variables to track rotation practice data
  var rotationPracticeSetSizes = 5;
  var rotationPracticeLetterSequence = [];
  var rotationPracticeResponseSequence = [];
  var rotationPracticeAccuracySequence = [];
  var rotationPracticeRotationSequence = [];

  plugin.info = {
    name: 'html-button-operationspan',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The HTML string to be displayed'
      },
      choices: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Choices',
        default: undefined,
        array: true,
        description: 'The labels for the buttons.'
      },
      button_html: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button HTML',
        default: '<button class="jspsych-btn-numpad" style = "width:120px; font-size: 20px" >%choice%</button>',
        array: true,
        description: 'The html of the button. Can create own style.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed under the button.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show the trial.'
      },
      margin_vertical: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin vertical',
        default: '0px',
        description: 'The vertical margin of the button.'
      },
      margin_horizontal: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin horizontal',
        default: '8px',
        description: 'The horizontal margin of the button.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, then trial will end when user responds.'
      },
      equation_accuracy: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, then trial will end when user responds.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {
    var n = trial.n();
    var nPracticeTrials = trial.nPracticeTrials();
    var setSizes = trial.setSizes();
    var nTrials = trial.nTrials();
    console.log('n_rotation', n);
    console.log('nPracticeTrials', nPracticeTrials);

    // Determine if this is a rotation practice trial
    var isRotationPractice = false;
    if (nPracticeTrials === 0 && n === 0 && setSizes === 0) {
      isRotationPractice = true;
      console.log("ROTATION PRACTICE TRIAL DETECTED");
    }

    // display stimulus
    var html = '<div id="jspsych-html-button-response-stimulus">'+trial.stimulus+'</div>';

    //display buttons
    var buttons = [];
    if (Array.isArray(trial.button_html)) {
      if (trial.button_html.length == trial.choices.length) {
        buttons = trial.button_html;
      } else {
        console.error('Error in html-button-response plugin. The length of the button_html array does not equal the length of the choices array');
      }
    } else {
      for (var i = 0; i < trial.choices.length; i++) {
        buttons.push(trial.button_html);
      }
    }
    html += '<div id="jspsych-html-button-response-btngroup">';
    for (var i = 0; i < trial.choices.length; i++) {
      var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
      html += '<div class="jspsych-html-button-response-button" style="display: inline-block; margin:'+20+' '+20+'" id="jspsych-html-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
    }
    html += '</div>';

    //show prompt if there is one
    if (trial.prompt !== null) {
      html += trial.prompt;
    }
    display_element.innerHTML = html;

    // start time
    var start_time = Date.now();

    // Store response data
    var response = {
      rt: null,
      button: null,
      originalChoice: null,
      accuracy: null
    };

    // add event listeners to buttons
    for (var i = 0; i < trial.choices.length; i++) {
      display_element.querySelector('#jspsych-html-button-response-button-' + i).addEventListener('click', function(e){
        var buttonChoice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility

        // Store the original choice
        response.originalChoice = parseInt(buttonChoice);

        // Calculate accuracy
        var acc = 0;
        if ((trial.equation_accuracy && buttonChoice == 1) || (!trial.equation_accuracy && buttonChoice == 0)){
          acc = 1;
        } else {
          acc = 0;
        }

        // Store accuracy in response object
        response.accuracy = acc;

        after_response();
      });
    }

    // function to handle responses by the subject
    function after_response() {
      // measure rt
      var end_time = Date.now();
      var rt = end_time - start_time;
      response.rt = rt;

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#jspsych-html-button-response-stimulus').className += ' responded';

      // disable all the buttons after a response
      var btns = document.querySelectorAll('.jspsych-html-button-response-button button');
      for(var i=0; i<btns.length; i++){
        //btns[i].removeEventListener('click');
        btns[i].setAttribute('disabled', 'disabled');
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // function to end trial when it is time
    function end_trial() {
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      if (n !== previousN) {
        // Reset these values for a new trial
        accuracy_sequence = [];
        response_sequence = [];
        letter_sequence = [];
        rotation_sequence = [];
        previousN = n;
      }

      // Get current letter
      var currentLetter = '';
      if (typeof letterSelection !== 'undefined' && letterSelection_id < letterSelection.length) {
        currentLetter = letterSelection[letterSelection_id];
      }
      letter_sequence.push(currentLetter);

      // Store whether letter is flipped (mirrored) or not
      rotation_sequence.push(letterAcc ? "Mirrored" : "Normal");

      // Store accuracy
      if (response.accuracy === null) {
        response.accuracy = 0;
      }
      accuracy_sequence.push(response.accuracy);

      // Convert numeric choice to "Normal" or "Mirror-image" based on the original button choice
      var responseText;
      if (response.originalChoice === null) {
        responseText = "NA"; // Or some other indicator that there was no response
      } else {
        responseText = (response.originalChoice == 0) ? "Normal" : "Mirrored";
      }      response_sequence.push(responseText);

      // Calculate accuracy sum for this trial
      var sumOfAccuracy = accuracy_sequence.reduce(function(accumulator, currentValue) {
        return accumulator + currentValue;
      }, 0);

      // Handle rotation practice trials
      if (isRotationPractice) {
        rotationPracticeLetterSequence.push(currentLetter);
        rotationPracticeResponseSequence.push(responseText);
        rotationPracticeRotationSequence.push(letterAcc ? "Mirrored" : "Normal");
        rotationPracticeAccuracySequence.push(response.accuracy);
      }

      // Count ALL rotation tasks in main trials (not practice trials)
      if ((n-nPracticeTrials) >= 2) {
        // Use response.accuracy for counting correct responses
        nCorrectRotation += response.accuracy;
        nRotationProblems += 1;
        console.log(`Counting rotation task: nCorrectRotation=${nCorrectRotation}, nRotationProblems=${nRotationProblems}`);
      }

      var rotationPercentCorrect = (nRotationProblems > 0) ?
          (nCorrectRotation / nRotationProblems * 100).toFixed(2) : "0.00";

      // gather the data to store for the trial
      var trial_data = {
        stimulus: trial.stimulus,
        accuracy: response.accuracy,  // Use correct accuracy
        trial_type: 'letter rotation',
        RSPAN_totalTrials: nTrials,
        RSPAN_nCorrectRotation: nCorrectRotation,
        RSPAN_nRotationProblems: nRotationProblems,
        RSPAN_rotationPercentCorrect: rotationPercentCorrect,
        // Add rotation practice data to all trials
        RSPAN_rotationPractice_SetSizes: rotationPracticeSetSizes,
        RSPAN_rotationPractice_letterSequence: rotationPracticeLetterSequence,
        RSPAN_rotationPractice_rotationResponseSequence: rotationPracticeResponseSequence,
        RSPAN_rotationPractice_rotationAccuracySequence: rotationPracticeAccuracySequence,
        RSPAN_rotationPractice_rotationSequence: rotationPracticeRotationSequence
      };

      if ((n-nPracticeTrials) === 0) {
        trial_data['RSPAN_p1_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_p1_letterSequence'] = letter_sequence;
        trial_data['RSPAN_p1_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_p1_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_p1_rotationSequence'] = rotation_sequence;
      } else if ((n-nPracticeTrials) === 1) {
        trial_data['RSPAN_p2_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_p2_letterSequence'] = letter_sequence;
        trial_data['RSPAN_p2_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_p2_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_p2_rotationSequence'] = rotation_sequence;
      } else if ((n-nPracticeTrials) === 2) {
        trial_data['RSPAN_1_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_1_letterSequence'] = letter_sequence;
        trial_data['RSPAN_1_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_1_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_1_rotationSequence'] = rotation_sequence;
      } else if ((n-nPracticeTrials) === 3) {
        trial_data['RSPAN_2_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_2_letterSequence'] = letter_sequence;
        trial_data['RSPAN_2_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_2_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_2_rotationSequence'] = rotation_sequence;
      } else if ((n-nPracticeTrials) === 4) {
        trial_data['RSPAN_3_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_3_letterSequence'] = letter_sequence;
        trial_data['RSPAN_3_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_3_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_3_rotationSequence'] = rotation_sequence;
      } else if ((n-nPracticeTrials) === 5) {
        trial_data['RSPAN_4_nRotationCorrect'] = sumOfAccuracy;
        trial_data['RSPAN_4_letterSequence'] = letter_sequence;
        trial_data['RSPAN_4_rotationResponseSequence'] = response_sequence;
        trial_data['RSPAN_4_rotationAccuracySequence'] = accuracy_sequence;
        trial_data['RSPAN_4_rotationSequence'] = rotation_sequence;
      }

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }

    // hide image if timing is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#jspsych-html-button-response-stimulus').style.visibility = 'hidden';
      }, trial.stimulus_duration);
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }

  };

  return plugin;
})();