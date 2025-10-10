/*
 * Example plugin template
 */

jsPsych.plugins["arrow recall"] = (function() {

  var plugin = {};
  var perfectRecall;
  var AbsoluteScore = 0;
  var TotalScore = 0;

  // Add these variables to track arrow practice data
  var arrowPracticeSetSizes = [];
  var arrowPracticeSequences = [];
  var arrowPracticeResponses = [];
  var arrowPracticeRecalled = [];

  jsPsych.pluginAPI.registerPreload('visual-search-circle', 'target', 'image');
  jsPsych.pluginAPI.registerPreload('visual-search-circle', 'foil', 'image');
  jsPsych.pluginAPI.registerPreload('visual-search-circle', 'fixation_image', 'image');


  plugin.info = {
    name: 'operation-span-recall', //'operation-span-recall'
    description: '',
    parameters: {
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show the trial.'
      },
      size_cells: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Cell sizes',
        default: 70,
        description: 'The size of each cell.'
      },
      correct_order: {
        type:jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: 'Record the correct array'
      }
    }
  }


  plugin.trial = function(display_element, trial) {
    var n = trial.n();
    var nPracticeTrials = trial.nPracticeTrials();
    var nLetters = trial.nLetters();
    console.log('n_letter',n);

// making matrix:
    var grid = 3;
    window.recalledGrid = [];
    window.recalledAngle = [];
    window.recalledLength = [];
    var correctLetters = trial.correct_order
    var display = " "

    var setSize = correctLetters.length
    var leftOver = 12-setSize

    recordClick = function(data){
      var tt = data.getAttribute('id')
      var tt = ("#"+tt)
      display_element.querySelector(tt).className = 'jspsych-operation-span-recall';
      var recalledN = (data.getAttribute('data-choice'));
      recalledGrid.push(numbertobutton[recalledN])
      var div = document.getElementById('recall_space');
      display += numbertobutton[recalledN] + " "
      div.innerHTML = display;
    }

    clearSpace = function(data) {
      let code = recalledGrid.pop();
      if (recalledAngle.length > 0) {
        recalledAngle.pop(); // Remove last angle from recalledAngle
      }
      if (recalledLength.length > 0) {
        recalledLength.pop(); // Remove last length from recalledLength
      }
      $(`line[code="${code}"], polygon[code="${code}"]`).attr({ fill: 'black', stroke: 'black' });
    };


    if (false) {
      var matrix = [];
      for (var i=0; i<4; i++){
        m1 = i;
        for (var h=0; h<3; h++){
          m2 = h;
          matrix.push([m1,m2])
        }
      };

      var paper_size = [(3*(trial.size_cells+30)), ((4*(trial.size_cells+20))+100)];

      display_element.innerHTML = '<div id="jspsych-html-button-response-btngroup" style= "position: relative; width:' + paper_size[0] + 'px; height:' + paper_size[1] + 'px"></div>';
      var paper = display_element.querySelector("#jspsych-html-button-response-btngroup");

      paper.innerHTML += '<div class="recall-space" style="position: absolute; top:'+ 0 +'px; left:'+(paper_size[0]/2-310)+'px; width:600px; height:64px" id="recall_space">'+ recalledGrid+'</div>';

      var buttons = ["F","H","J","K","L","N","P","Q","R","S","T","V"]

      for (var i = 0; i < matrix.length; i++) {
        var str = buttons[i]
        paper.innerHTML += '<div class="jspsych-operation-span-recall" style="position: absolute; top:'+ (matrix[i][0]*(trial.size_cells+20)+80) +'px; left:'+matrix[i][1]*(trial.size_cells+30)+'px; width:'+(trial.size_cells-6)+'px; height:'+(trial.size_cells-6)+'px"; id="jspsych-spatial-span-grid-button-' + i +'" data-choice="'+i+'" onclick="recordClick(this)">'+str+'</div>';
      }
    }

    $.get('recall.html', (data) => {
      $(display_element).prepend(data)
    })

    display_element.innerHTML += '<div class="jspsych-btn-numpad" style="display: inline-block; margin:'+10+' '+2+'" id="jspsych-html-button-response-button-clear" onclick="clearSpace(this)">Backspace</div>';

    display_element.innerHTML += '<div class="jspsych-btn-numpad" style="display: inline-block; margin:'+10+' '+40+'" id="jspsych-html-button-response-button">Continue</div>';


    var start_time = Date.now();

    display_element.querySelector('#jspsych-html-button-response-button').addEventListener('click', function(e){
      var acc=0
      for (var i=0; i<correctLetters.length; i++){
        if (recalledGrid[i] === arrowCodes[i]){
          acc += 1
        }
      }
      //console.log(correctLetters, )
      //console.log(indexOfArray(correctGrid[1], matrix), recalledGrid[1])
      after_response(acc);
    });

    var response = {
      rt: null,
      button: null
    };


    function after_response(choice) {

      // measure rt
      var end_time = Date.now();
      var rt = end_time - start_time;
      var choiceRecord = choice;
      response.button = choice;
      response.rt = rt;

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      //display_element.querySelector('#jspsych-html-button-response-stimulus').className += ' responded';

      // disable all the buttons after a response
      var btns = document.querySelectorAll('.jspsych-html-button-response-button button');
      for(var i=0; i<btns.length; i++){
        //btns[i].removeEventListener('click');
        btns[i].setAttribute('disabled', 'disabled');
      }

      clear_display();
      end_trial();
    };

    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        clear_display();
        end_trial();
      }, trial.trial_duration);
    }

    function clear_display(){
      display_element.innerHTML = '';
    }


    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // Set perfectRecall values (numeric)
      var perfectRecallNumeric;
      if (response.button === nLetters) {
        perfectRecallNumeric = 1;
      } else {
        perfectRecallNumeric = 0;
      }

      var perfectRecallText = perfectRecallNumeric === 1 ? "Yes" : "No";
      perfectRecall = perfectRecallText; // Store as text

      if (n < nPracticeTrials) {
        arrowPracticeSetSizes.push(nLetters);
        arrowPracticeSequences.push(arrowCodes.slice());
        arrowPracticeResponses.push(recalledGrid.slice());
        arrowPracticeRecalled.push(response.button);
      }

      if ((n-nPracticeTrials) >= 2) {
        AbsoluteScore += perfectRecallNumeric;
        TotalScore += response.button;
      }

      // gather the data to store for the trial
      var trial_data = {
        accuracy: response.button,
        trial_type: 'arrow recall',
        RSPAN_AbsoluteScore: AbsoluteScore,
        RSPAN_TotalScore: TotalScore,
        RSPAN_arrowPractice_SetSizes: arrowPracticeSetSizes,
        RSPAN_arrowPractice_arrowSequence: arrowPracticeSequences,
        RSPAN_arrowPractice_arrowResponseSequence: arrowPracticeResponses,
        RSPAN_arrowPractice_nArrowsRecalled: arrowPracticeRecalled
      };

      if ((n-nPracticeTrials) === 0) {
        trial_data['RSPAN_p1_setSize'] = nLetters;
        trial_data['RSPAN_p1_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_p1_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_p1_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_p1_arrowResponseSequence'] = recalledGrid;
      } else if ((n-nPracticeTrials) === 1) {
        trial_data['RSPAN_p2_setSize'] = nLetters;
        trial_data['RSPAN_p2_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_p2_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_p2_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_p2_arrowResponseSequence'] = recalledGrid;
      } else if ((n-nPracticeTrials) === 2) {
        trial_data['RSPAN_1_setSize'] = nLetters;
        trial_data['RSPAN_1_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_1_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_1_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_1_arrowResponseSequence'] = recalledGrid;
      } else if ((n-nPracticeTrials) === 3) {
        trial_data['RSPAN_2_setSize'] = nLetters;
        trial_data['RSPAN_2_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_2_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_2_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_2_arrowResponseSequence'] = recalledGrid;
      } else if ((n-nPracticeTrials) === 4) {
        trial_data['RSPAN_3_setSize'] = nLetters;
        trial_data['RSPAN_3_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_3_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_3_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_3_arrowResponseSequence'] = recalledGrid;
      } else if ((n-nPracticeTrials) === 5) {
        trial_data['RSPAN_4_setSize'] = nLetters;
        trial_data['RSPAN_4_perfectRecall'] = perfectRecall;
        trial_data['RSPAN_4_nArrowsRecalled'] = response.button;
        trial_data['RSPAN_4_arrowSequence'] = arrowCodes;
        trial_data['RSPAN_4_arrowResponseSequence'] = recalledGrid;
      }

      // var trial_data = {
      //   rt: response.rt,
      //   recall: recalledGrid,
      //   correct_arrow_sequence: arrowCodes,
      //   accuracy: response.button,
      //   recalledAngle: JSON.stringify(recalledAngle),
      //   recalledLength: JSON.stringify(recalledLength),
      // };
      //console.log("Trial Data:", trial_data);
      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }
  };

  return plugin;
})();
