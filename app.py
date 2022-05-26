import os
import uuid
from flask import Flask, session, render_template, request
import requests


app = Flask(__name__)
app.secret_key = b'this-is-a-really-secret-key'


all_files = sorted(os.listdir('static/audio'))
files = [file for file in all_files if file.endswith('.wav')]
print(files)


@app.route("/")
def show_index_page():
    session['token'] = uuid.UUID(bytes=os.urandom(16))
    print('Welcome token: ' + str(session['token']))
    return render_template('index.html')

@app.route("/audio")
def show_audio_page():
    audio_files = files
    return render_template(
        'audio.html',
        audio_files=audio_files)


if __name__ == '__main__':
    app.run(debug=True)
