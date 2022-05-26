import os
import uuid
from flask import Flask, render_template, request, jsonify


app = Flask(__name__)
app.secret_key = b'this-is-a-really-secret-key'


@app.route("/", methods=['POST', 'GET'])
def show_index_page():
    if request.method == "POST":
        f = open('./file.wav', 'wb')
        f.write(request.get_data("audio_data"))
        f.close()

        print('File file.wav saved.')
        print('Running analysis on the file...')
        print('Getting response from server...')
        return_data = {'laughterDetected': True}
        return jsonify(return_data)
    else:
        return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True)
