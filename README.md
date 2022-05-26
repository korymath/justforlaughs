# Just For Laughs

## Setup

```sh

pip install --upgrade pip
pip install flask requests gunicorn uuid
```

## Run

```sh
python app.py
```

## Fixes

For running on mac, need to ensure that the libsndfile is correclty pathed, ref: https://github.com/bastibe/python-soundfile/issues/310
```sh
env DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH" python app.py
```


## Credits

Based on:

* https://github.com/mattdiamond/Recorderjs
* https://github.com/addpipe/simple-recorderjs-demo
* https://blog.addpipe.com/using-recorder-js-to-capture-wav-audio-in-your-html5-web-site/