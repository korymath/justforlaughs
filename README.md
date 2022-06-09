# Just For Laughs

<img src="https://user-images.githubusercontent.com/178099/170729568-57fec58a-4884-4250-b954-e77e3f3a108c.png" width="250">

## Setup

```sh
# Get the code
git clone https://github.com/korymath/justforlaughs;
cd justforlaughs/;
python3 -m venv venv;
source venv/bin/activate;

# Install requirements
pip install --upgrade pip;
pip install -r requirements.txt;
```

## Run

```sh
# Run the web app
python app.py;

# Run the standalone laughter detector
python segment_laughter.py --input_audio_file example_audio.wav;

# It should output that it found 1 laugh in the example, save just the laugh cropped from the input, and the time window when laugh happened.

# Example:
# found 1 laughs.
# [{'filename': 'output/laugh_0.wav', 'start': 2.6453333333333333, 'end': 5.261913043478261}]
```

## Fixes

For running on mac, need to ensure that the libsndfile is correclty pathed, ref: https://github.com/bastibe/python-soundfile/issues/310
```sh
env DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH" python app.py
```


## Credits

Client-sider in-browser detection from:

* https://github.com/tensorflow/tfjs-models/tree/master/speech-commands - [LICENSE](https://github.com/tensorflow/tfjs-models/blob/master/LICENSE)

Laughter detection model from:

* https://github.com/jrgillick/laughter-detection - [LICENSE](https://github.com/jrgillick/laughter-detection/blob/master/LICENSE)

Audio interface and recording adapted from:

* https://github.com/mattdiamond/Recorderjs - [LICENSE](https://github.com/mattdiamond/Recorderjs#license-mit)
* https://github.com/addpipe/simple-recorderjs-demo - [No LICENSE](https://github.com/addpipe/simple-recorderjs-demo/issues/11), [Blog post](https://blog.addpipe.com/using-recorder-js-to-capture-wav-audio-in-your-html5-web-site/)
