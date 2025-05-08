/**
 * jspsych-html-button-response
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["html-button-operationspan"] = (function() {

  var plugin = {};
  var choice;
  var operations = [];
  var accuracy_sequence = [];
  var response_sequence = [];
  var previousN = -1;
  var nCorrectMath = 0;
  var nMathProblems = 0;
  var mathPracticeSetSizes = 5;
  var mathPracticeSequences = [];
  var mathPracticeResponses = [];
  var mathPracticeAccuracy = [];

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
    console.log('n_math',n)

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

    // add event listeners to buttons
    for (var i = 0; i < trial.choices.length; i++) {
      display_element.querySelector('#jspsych-html-button-response-button-' + i).addEventListener('click', function(e){
        choice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility
        if ((trial.equation_accuracy) && (choice==0)){
          acc = 1
        } else if ((!trial.equation_accuracy) && (choice == 1)){
          acc = 1
        } else{
          acc = 0
        }
        after_response(acc);
      });
    }

    // store response
    var response = {
      rt: null,
      button: null
    };

    // function to handle responses by the subject
    function after_response(choice) {

      // measure rt
      var end_time = Date.now();
      var rt = end_time - start_time;
      response.button = choice;
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
    }
    // function to end trial when it is time
    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // Check if 'n' has changed since the last trial
      if (n !== previousN) {
        // Reset accuracy and operations
        accuracy_sequence = [];
        response_sequence = [];
        operations = [];
        previousN = n;
      }

      var tempElement = document.createElement('div');
      // Set its innerHTML to the stimulus
      tempElement.innerHTML = trial.stimulus;
      // Extract the text content
      var textContent = tempElement.textContent || tempElement.innerText || "";
      operations.push(textContent);
      accuracy_sequence.push(response.button);

      // Convert response choice (0 or 1) to "True" or "False"
      var responseText = (choice == 0) ? "True" : "False";
      response_sequence.push(responseText); // Store as text instead of numeric value

      // Calculate the sum of math correct in every trial
      var sumOfAccuracy = accuracy_sequence.reduce(function(accumulator, currentValue) {
        return accumulator + (currentValue || 0);
      }, 0);

      // For math practice trials (n = 0, the second practice section)
      if (trial.nPracticeTrials() === 0 && trial.n() === 0) {
        // This is a math practice trial - save the data for each problem
        mathPracticeSequences.push(textContent);
        mathPracticeResponses.push(responseText);
        mathPracticeAccuracy.push(response.button);
      }

      // Main trials begin after practice trials
      if ((n-nPracticeTrials) >= 2) {
        // Count EACH correct math problem
        nCorrectMath += response.button; // Add 1 for correct, 0 for incorrect
        nMathProblems += 1; // Count each problem individually
      }

      var mathPercentCorrect = (nMathProblems > 0) ? (nCorrectMath / nMathProblems * 100).toFixed(2) : "0.00";

      // gather the data to store for the trial
      var trial_data = {
        trial_type: 'math problem',
        accuracy: response.button,
        OSPAN_totalTrials: nTrials,
        OSPAN_nCorrectMath: nCorrectMath,
        OSPAN_nMathProblems: nMathProblems,
        OSPAN_mathPercentCorrect: mathPercentCorrect,
        // Add math practice variables to every trial's data
        OSPAN_mathPractice_SetSizes: mathPracticeSetSizes,
        OSPAN_mathPractice_mathSequence: mathPracticeSequences,
        OSPAN_mathPractice_mathResponseSequence: mathPracticeResponses,
        OSPAN_mathPractice_mathAccuracySequence: mathPracticeAccuracy
      };

      if ((n-nPracticeTrials) === 0) {
        trial_data['OSPAN_p1_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_p1_mathSequence'] = operations;
        trial_data['OSPAN_p1_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_p1_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 1) {
        trial_data['OSPAN_p2_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_p2_mathSequence'] = operations;
        trial_data['OSPAN_p2_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_p2_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 2) {
        trial_data['OSPAN_1_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_1_mathSequence'] = operations;
        trial_data['OSPAN_1_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_1_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 3) {
        trial_data['OSPAN_2_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_2_mathSequence'] = operations;
        trial_data['OSPAN_2_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_2_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 4) {
        trial_data['OSPAN_3_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_3_mathSequence'] = operations;
        trial_data['OSPAN_3_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_3_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 5) {
        trial_data['OSPAN_4_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_4_mathSequence'] = operations;
        trial_data['OSPAN_4_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_4_mathAccuracySequence'] = accuracy_sequence;
      } else if ((n-nPracticeTrials) === 6) {
        trial_data['OSPAN_5_nMathCorrect'] = sumOfAccuracy;
        trial_data['OSPAN_5_mathSequence'] = operations;
        trial_data['OSPAN_5_mathResponseSequence'] = response_sequence;
        trial_data['OSPAN_5_mathAccuracySequence'] = accuracy_sequence;
      }

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

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
