var colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];
var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'
var ignore_onend = false;

var diagnostic = document.querySelector('.output');
var bg = document.querySelector('html');
var hints = document.querySelector('.hints');


var muted = new Boolean(false);

var final_transcript = '';

var array_of_sounds = [];
var sound = null;
var stored_text_en = null;
var stored_text_translation = null;
var stored_english_sounds = [];

var stored_raw_audios = [];

var voice_key = 'male'

// The rate of playback. 0.5 to 4.0, with 1.0 being normal speed.
var playbackRate = 1.0;

let log = console.log.bind(console),
  id = val => document.getElementById(val),
  ul = id('ul'),
  gUMbtn = id('gUMbtn'),
  start = id('start'),
  stop = id('stop'),
  stream,
  recorder,
  counter=1,
  recordingBuffer,
  media;

showInfo('info_start');

navigator.mediaDevices.getUserMedia({audio:true}).then(_stream => {
    console.log('opus supported: ', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));
    var _options = {
        audioBitsPerSecond : 16000,
        // opus over vorbis (https://en.wikipedia.org/wiki/Opus_(audio_format))
        mimeType : 'audio/webm;codecs=opus'
    }
    recorder = new MediaRecorder(_stream, _options);
    recorder.ondataavailable = e => {
        recordingBuffer.push(e.data);
        if (recorder.state == 'inactive') {
            packageForTransmission();
        }
    };
    console.log('got media successfully');
    console.log('mimeType', recorder.mimeType);
});

function packageForTransmission(){
    let blob = new Blob(recordingBuffer, {type: 'audio/webm;codecs=opus' })
        , url = URL.createObjectURL(blob)
        , li = document.createElement('li')
        , mt = document.createElement('audio')
        , hf = document.createElement('a');

    var formData = new FormData();
    var ds = (new Date()).toISOString().replace(/[^0-9]/g, "");
    var blobFileName = ds.concat('.ogg');

    mt.controls = true;
    mt.src = url;
    hf.href = url;
    hf.download = blobFileName;
    hf.innerHTML = `download ${hf.download}`;
    li.appendChild(mt);
    li.appendChild(hf);
    ul.appendChild(li);

    formData.append('fileblob', blob, blobFileName);
    console.log('uploading: ', blobFileName);
    console.log('url', url);

    stored_raw_audio = new Howl({
        src: [url],
        format: ['ogg'],
        autoplay: false,
        loop: false,
        volume: 1.0,
        onpause: function() {
            console.log('Paused Raw Audio.')
        },
        onplay: function() {
            console.log('Playing Raw Audio.')
        },
        onend: function() {
            console.log('Finished playing raw audio.');
    }});
    // store the english to an array
    stored_raw_audios.push(stored_raw_audio);

    $.ajax({
        type: 'POST',
        url: '/upload',
        data: formData,
        processData: false,  // prevent jQuery from converting the data
        contentType: false,  // prevent jQuery from overriding content type
        success: function(response) {
            console.log('Upload response: ', response);
        }
    });
}

if (!annyang) {
    console.log("Speech Recognition is not supported");
} else {
    console.log('Annyang, WaveNet and Howler');
}

annyang.addCallback('soundstart', function() {
    console.log('sound detected');
});

annyang.addCallback('result', function() {
    console.log('sound stopped');
});

document.onkeypress = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);
    if (!evt.repeat) {
        if (charStr == 'm') {
            // invert boolen toggle
            muted = !muted;
            // log
            console.log('toggle mute', muted);
            // toggle mute
            Howler.mute(muted)
        } else if (charStr == 'n') {
            console.log('number of active sounds',
                array_of_sounds.length);
            array_of_sounds.forEach(function(sound) {
                if (sound.playing()) {
                    sound.pause();
                } else {
                    sound.play();
                }
            });
        } else if (charStr == 'b') {
            if (annyang.isListening()) {
                annyang.pause();
                console.log('annyang paused');
            } else {
                annyang.start({ autoRestart: true, continuous: false });
                console.log('speech recognition started');
            }
        } else if (charStr == 'e') {
            if (stored_text_en != null) {
                stored_text_en.stop();
                stored_text_translation.stop();
                stored_text_en.play();
                console.log('replaying text_en');
            } else {
                console.log('no stored text_en');
            }
        } else if (charStr == 'v') {
            if (voice_key == 'male') {
                voice_key = 'female';
                console.log('voice changed to female');
            } else {
                voice_key = 'male';
                console.log('voice changed to male');
            }
        } else if (charStr == 'f') {
            if (stored_text_translation != null) {
                stored_text_en.stop();
                stored_text_translation.stop();
                stored_text_translation.play();
                console.log('replaying text_translation');
            } else {
                console.log('no stored text_translation');
            }
        } else if (charStr == '1' || charStr == '2' || charStr == '3' || charStr == '4') {
            if (stored_english_sounds.length > 0) {
                stored_english_sounds[Number(charStr)-1].stop();
                stored_english_sounds[Number(charStr)-1].play();
                console.log('replay sound array index: ', Number(charStr));
            } else {
                console.log('no stored sound array');
            }
        } else if (charStr == '6' || charStr == '7' || charStr == '8' || charStr == '9') {
            if (stored_raw_audios.length > 0) {
                stored_raw_audios[Number(charStr)-6].stop();
                stored_raw_audios[Number(charStr)-6].play();
                console.log('replay sound array index: ', Number(charStr));
            } else {
                console.log('no stored sound array');
            }
        }
    } else {
        console.log('key press is repeating')
    }
};

function hardStopSound(local_sound) {
    //check if sound is null, if not stop previous sound and unload it
    if (local_sound != null) {
        local_sound.stop();
        local_sound.unload();
        local_sound = null;
    }
}

// This function stops the previously playing sound, unloads it from cache and plays the new sound
function playSound() {
    hardStopSound(sound);
    sound = new Howl({
        src: ['data:audio/ogg;base64,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'],
        format: ['ogg'],
        autoplay: false,
        volume: 1.0,
        rate: playbackRate,
    });
    console.log('playSound');
    sound.play();
}

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function changePlaybackRate(newRate) {
    newRateScaled = scaleBetween(newRate, 0.5, 2.0, 1, 127)
    playbackRate = newRateScaled;
}

var norecog = new Howl({
  src: ['data:audio/ogg;base64,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'],
  format: ['ogg'],
  autoplay: false,
  loop: false,
  volume: 1.0,
  onplay: function() {
    console.log('Recognition stopped.');
    annyang.abort()
  },
  onend: function() {
    console.log('Finished playing norecog.');
  }
});

var recogstop = new Howl({
  src: ['data:audio/ogg;base64,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'],
  format: ['ogg'],
  autoplay: false,
  loop: false,
  volume: 1.0,
  onplay: function() {
    console.log('Recognition stopped.');
    annyang.abort()
  },
  onend: function() {
    console.log('Finished playing recogstop.');
  }
});

var whatisfave = new Howl({
  src: ['data:audio/ogg;base64,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'],
  format: ['ogg'],
  autoplay: false,
  loop: false,
  volume: 1.0,
  onend: function() {
    console.log('Finished playing whatisfave.');
    console.log('What is your favorite color?');
    annyang.start({ autoRestart: false, continuous: false });
  }
});

var colorHTML= '';
colors.forEach(function(v, i, a){
  // console.log(v, i);
  colorHTML += '<span style="background-color:' + v + ';"> ' + v + ' </span>';
});
hints.innerHTML = 'Try ' + colorHTML + '.';

annyang.addCallback('start', function() {
    showInfo('info_speak_now');
    // clear the recording buffer
    recordingBuffer = [];
    // ensure it is stopped
    if (recorder.state == 'recording') {
        recorder.stop();
    }
    // start the recorder
    recorder.start();
    start_img.src = 'static/img/mic-animate.gif';
});

annyang.addCallback('end', function() {
  if (ignore_onend) {
    return;
  }
  start_img.src = 'static/img/mic.gif';
  if (!final_transcript) {
    showInfo('info_start');
    return;
  }
  showInfo('');
});

annyang.addCallback('result', function(phrases) {
  // stop the recorder
  recorder.stop();
  start_img.src = 'static/img/mic.gif';
  console.log("I think the user said: ", phrases[0]);
  console.log("But then again, it could be any of the following: ", phrases);
  var text_to_synth = phrases[0]
  diagnostic.textContent = 'Result received: ' + text_to_synth + '.';
  annyang.abort()
  console.log('Recognition stopped.');

  // when a result comes in, synthesize it and the translation
  $.post( "/synthesize", {
    'text_to_synth': text_to_synth,
    'voice_key': voice_key
  }).done(function(data) {
    console.log(data)
    if (data.playable == true) {
        var text_translation = new Howl({
            src: [data.audio_trans],
            format: ['ogg'],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onpause: function() {
                console.log('Paused translation line.')
            },
            onplay: function() {
                console.log('Playing translation line.')
            },
            onend: function() {
                array_of_sounds = [];
                console.log('Recognition stopped.');
                console.log('Finished playing text_translation.');
        }});
        // out with the old and in with the new
        var text_en = new Howl({
            src: [data.audio_en],
            format: ['ogg'],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onpause: function() {
                console.log('Paused English line.')
            },
            onplay: function() {
                console.log('Playing English line.')
            },
            onend: function() {
                array_of_sounds.shift();
                console.log('new length', array_of_sounds.length)
                console.log('Finished playing text_en.');
                array_of_sounds.push(text_translation);
                text_translation.play();
        }});
        // out with the old and in with the new
        array_of_sounds.push(text_en);
        text_en.play()

        // store the latest lines
        stored_text_translation = new Howl({
            src: [data.audio_trans],
            format: ['ogg'],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onpause: function() {
                console.log('Paused translation line.')
            },
            onplay: function() {
                console.log('Playing translation line.')
            },
            onend: function() {
                console.log('Finished playing text_translation.');
        }});

        // out with the old and in with the new
        stored_text_en = new Howl({
            src: [data.audio_en],
            format: ['ogg'],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onpause: function() {
                console.log('Paused English line.')
            },
            onplay: function() {
                console.log('Playing English line.')
            },
            onend: function() {
                console.log('Finished playing text_en.');
        }});
        // store the english to an array
        stored_english_sounds.push(stored_text_en);
    }});
  bg.style.backgroundColor = text_to_synth;
  console.log('Result received: ' + text_to_synth);
  console.log('Confidence: ' + event.results[0][0].confidence);
});

annyang.addCallback('error', function(event) {
  start_img.src = 'static/img/mic.gif';
  diagnostic.textContent = 'Recognition diagnostic: ' + event.error;
  console.log(diagnostic.textContent)
  if (event.error == 'no-speech') {
    start_img.src = 'static/img/mic.gif';
    showInfo('info_no_speech');
    ignore_onend = true;
  }
  if (event.error == 'aborted') {
    console.log('aborted, encoded recognition naturally')
  }
  if (event.error == 'audio-capture') {
    showInfo('info_no_microphone');
    ignore_onend = true;
  }
  if (event.error == 'network') {
    console.log(event)
    showInfo('info_network');
    ignore_onend = true;
  }
  if (event.error == 'not-allowed') {
    if (event.timeStamp - start_timestamp < 100) {
      showInfo('info_blocked');
    } else {
      showInfo('info_denied');
    }
    ignore_onend = true;
  }
});

function startButton(event) {
  if (annyang.isListening()) {
    norecog.play()
    return;
  }
  final_transcript = '';
  diagnostic.textContent = 'Listening';
  // whatisfave.play()
  ignore_onend = false;
  start_img.src = 'static/img/mic-slash.gif';
  showInfo('info_allow');
  start_timestamp = event.timeStamp;
}

function startButtonOneThousand(event) {
  if (annyang.isListening()) {
    norecog.play()
    return;
  }
  final_transcript = '';
  // diagnostic.textContent = 'Listening';
  // whatisfave.play()
  ignore_onend = false;
  start_img.src = 'static/img/mic-slash.gif';
  // showInfo('info_allow');
  start_timestamp = event.timeStamp;
}

function showInfo(s) {
  if (s) {
    for (var child = info.firstChild; child; child = child.nextSibling) {
      if (child.style) {
        child.style.display = child.id == s ? 'inline' : 'none';
      }
    }
    info.style.visibility = 'visible';
  } else {
    info.style.visibility = 'hidden';
  }
}


// MIDI CONTROLS
window.onload = function () {
    var
        divLog = document.getElementById('log'),
        divInputs = document.getElementById('inputs'),
        divOutputs = document.getElementById('outputs'),
        midiAccess,
        checkboxMIDIInOnChange,
        checkboxMIDIOutOnChange,
        activeInputs = {},
        activeOutputs = {};

    if (navigator.requestMIDIAccess !== undefined) {
        navigator.requestMIDIAccess().then(

            function onFulfilled(access) {
                midiAccess = access;

                // create list of all currently connected MIDI devices
                showMIDIPorts();

                // update the device list when devices get connected, disconnected, opened or closed
                midiAccess.onstatechange = function (e) {
                    var port = e.port;
                    var div = port.type === 'input' ? divInputs : divOutputs;
                    var listener = port.type === 'input' ? checkboxMIDIInOnChange : checkboxMIDIOutOnChange;
                    var activePorts = port.type === 'input' ? activeInputs : activeOutputs;
                    var checkbox = document.getElementById(port.type + port.id);
                    var label;

                    // device disconnected
                    if (port.state === 'disconnected') {
                        port.close();
                        label = checkbox.parentNode;
                        checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
                        checkbox.disabled = true;
                        checkbox.checked = false;
                        delete activePorts[port.type + port.id];

                    // new device connected
                    } else if (checkbox === null) {
                        label = document.createElement('label');
                        checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = port.type + port.id;
                        checkbox.addEventListener('change', listener, false);
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(port.name + ' (' + port.state + ', ' + port.connection + ')'));
                        div.appendChild(label);
                        div.appendChild(document.createElement('br'));

                    // device opened or closed
                    } else if (checkbox !== null) {
                        label = checkbox.parentNode;
                        checkbox.disabled = false;
                        checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
                    }
                };
            },

            function onRejected(e) {
                divInputs.innerHTML = e.message;
                divOutputs.innerHTML = '';
            }
        );
    }

    // browsers without WebMIDI API or Jazz plugin
    else {
        divInputs.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
        divOutputs.innerHTML = '';
    }

    function showMIDIPorts() {
        var
            html,
            checkbox,
            checkboxes,
            inputs,
            outputs,
            i,
            maxi;

        inputs = midiAccess.inputs;
        html = '<h4>midi inputs:</h4>';
        inputs.forEach(function (port) {
            html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' + port.connection + ')</label><br>';
        });
        divInputs.innerHTML = html;

        outputs = midiAccess.outputs;
        html = '<h4>midi outputs:</h4>';
        outputs.forEach(function (port) {
            html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' + port.connection + ')</label><br>';
        });
        divOutputs.innerHTML = html;

        checkboxes = document.querySelectorAll('#inputs input[type="checkbox"]');
        for (i = 0, maxi = checkboxes.length; i < maxi; i++) {
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', checkboxMIDIInOnChange, false);
        }

        checkboxes = document.querySelectorAll('#outputs input[type="checkbox"]');
        for (i = 0, maxi = checkboxes.length; i < maxi; i++) {
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', checkboxMIDIOutOnChange, false);
        }
    }

    // handle incoming MIDI messages
    function inputListener(midimessageEvent) {
        var port,
            portId,
            data = midimessageEvent.data,
            type = data[0],
            data1 = data[1],
            data2 = data[2];

        // do something graphical with the incoming midi data
        divLog.innerHTML = type + ' ' + data1 + ' ' + data2 + '<br>' + divLog.innerHTML;

        // trigger the recognition event if the correct button is pressed
        // console.log(data1);
        //console.log(typeof data1); //number

        if ((data1 === 40) && (data2 > 0)) {
          startButton(event)
        }

        if ((data1 === 42) && (data2 > 0)) {
          recogstop.play()
        }

        if ((data1 === 44) && (data2 > 0)) {
          recogstop.play()
        }

        if ((data1 === 43) && (data2 > 0)) {
          playSound()
        }

        if ((data1 === 1) && (data2 > 0)) {
          changePlaybackRate(data2)
        }


        for (portId in activeOutputs) {
            if (activeOutputs.hasOwnProperty(portId)) {
                port = activeOutputs[portId];
                port.send(data);
            }
        }
    }

    checkboxMIDIInOnChange = function () {
        // port id is the same a the checkbox id
        var id = this.id;
        var port = midiAccess.inputs.get(id.replace('input', ''));
        if (this.checked === true) {
            activeInputs[id] = port;
            // implicitly open port by adding an onmidimessage listener
            port.onmidimessage = inputListener;
        } else {
            delete activeInputs[id];
            port.close();
        }
    };

    checkboxMIDIOutOnChange = function () {
        // port id is the same a the checkbox id
        var id = this.id;
        var port = midiAccess.outputs.get(id.replace('output', ''));
        if (this.checked === true) {
            activeOutputs[id] = port;
            port.open();
        } else {
            delete activeOutputs[id];
            port.close();
        }
    };
};


// Create an analyser node in the Howler WebAudio context
var analyser = Howler.ctx.createAnalyser();
// Connect the masterGain -> analyser (disconnecting masterGain -> destination)
Howler.masterGain.connect(analyser);

analyser.fftSize = 1024;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);

var canvas = document.getElementById("visualizer");
var canvasCtx = canvas.getContext("2d");

// draw an oscilloscope of the current audio source
function outputDraw() {
  requestAnimationFrame(outputDraw);
  analyser.getByteTimeDomainData(dataArray);
  canvasCtx.fillStyle = "rgb(200, 200, 200)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(0, 0, 0)";
  canvasCtx.beginPath();
  var sliceWidth = canvas.width * 1.0 / bufferLength;
  var x = 0;
  for (var i = 0; i < bufferLength; i++) {
    var v = dataArray[i] / 128.0;
    var y = v * canvas.height / 2;
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}
outputDraw();


// var mic;
// var song, analyzer, fft, peakDetect, peaks;
// var timestamp = new Date().getTime();
// var smoothing = 0.8; // play with this, between 0 and .99
// var binCount = 1024; // size of resulting FFT array. Must be a power of 2 between 16 an 1024
// var particles =  new Array(binCount);

// function preload() {
//     // song = loadSound('/bits/p5js-sound-visualization-example/files/loopSound.mp3');
//     fft = new p5.FFT();
//     peakDetect = new p5.PeakDetect();
// }

// function setup() {
//     //peaks = song.getPeaks();

//     var canvas = createCanvas(windowWidth, 150);
//     canvas.parent('sketch-holder');

//     // Create an Audio input
//     mic = new p5.AudioIn();

//     // start the Audio Input.
//     // By default, it does not .connect() (to the computer speakers)
//     mic.start();

//     // initialize the FFT, plug in our variables for smoothing and binCount
//     fft = new p5.FFT(smoothing, binCount);
//     fft.setInput(mic);

//     // instantiate the particles.
//     for (var i = 0; i < particles.length; i++) {
//         var x = map(i, 0, binCount, 0, width * 2);
//         var y = random(0, height);
//         var position = createVector(x, y);
//         particles[i] = new Particle(position);
//     }
// }
// var r = 0, g = 0, b = 0, o = 0;

// function draw() {
//    background(200);

//    var spectrum = fft.analyze();

//    beginShape();
//    for (i = 0; i<spectrum.length; i++) {
//     vertex(i, map(spectrum[i], 0, 255, height, 0) );
//    }
//    endShape();
// }

// function draw() {
//   background(0, 0, 0, 100);

//   // returns an array with [binCount] amplitude readings from lowest to highest frequencies
//   var spectrum = fft.analyze(binCount);

//   // update and draw all [binCount] particles!
//   // Each particle gets a level that corresponds to
//   // the level at one bin of the FFT spectrum.
//   // This level is like amplitude, often called "energy."
//   // It will be a number between 0-255.
//   for (var i = 0; i < binCount; i++) {
//     var thisLevel = map(spectrum[i], 0, 255, 0, 1);

//     // update values based on amplitude at this part of the frequency spectrum
//     particles[i].update( thisLevel );

//     // draw the particle
//     particles[i].draw();

//     // update x position (in case we change the bin count while live coding)
//     particles[i].position.x = map(i, 0, binCount, 0, width * 2);
//   }
// }

// // ===============
// // Particle class
// // ===============

// var Particle = function(position) {
//   this.position = position;
//   this.scale = random(0, 1);
//   this.speed = createVector(0, random(0, 10) );
//   this.color = [random(0, 255), random(0,255), random(0,255)];
// }

// var theyExpand = 1;

// // use FFT bin level to change speed and diameter
// Particle.prototype.update = function(someLevel) {
//   this.position.y += this.speed.y / (someLevel*2);
//   if (this.position.y > height) {
//     this.position.y = 0;
//   }
//   this.diameter = map(someLevel, 0, 1, 0, 100) * this.scale * theyExpand;

// }

// Particle.prototype.draw = function() {
//   fill(this.color);
//   ellipse(
//     this.position.x, this.position.y,
//     this.diameter, this.diameter
//   );
// }
