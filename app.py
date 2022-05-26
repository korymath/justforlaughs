import argparse
import io
import os
import pickle
import sys
import time
import uuid
from distutils.util import strtobool
from functools import partial

import librosa
import numpy as np
import pandas as pd
import scipy
import tgt
import torch
from flask import Flask, jsonify, render_template, request
from scipy.io.wavfile import read, write
from torch import nn, optim
from tqdm import tqdm

import audio_utils
import configs
import data_loaders
import dataset_utils
import laugh_segmenter
import models
import torch_utils

sample_rate = 8000


app = Flask(__name__)
app.secret_key = b'this-is-a-really-secret-key'


model_path = 'checkpoints/'
config = configs.CONFIG_MAP['resnet_with_augmentation']
threshold = 0.5
min_length = 0.2

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device {device}")

# Load the Model

model = config['model'](
    dropout_rate=0.0, linear_layer_size=config['linear_layer_size'], filter_sizes=config['filter_sizes'])
feature_fn = config['feature_fn']
model.set_device(device)

if os.path.exists(model_path):
    torch_utils.load_checkpoint(model_path+'/best.pth.tar', model)
    model.eval()
else:
    raise Exception(f"Model checkpoint not found at {model_path}")


def run_laughter_detection(audio_path):
    # Load the audio file and features
    inference_dataset = data_loaders.SwitchBoardLaughterInferenceDataset(
        audio_path=audio_path, feature_fn=feature_fn, sr=sample_rate)

    collate_fn = partial(audio_utils.pad_sequences_with_labels,
                         expand_channel_dim=config['expand_channel_dim'])

    inference_generator = torch.utils.data.DataLoader(
        inference_dataset, num_workers=2,
        batch_size=16, shuffle=False,
        collate_fn=collate_fn)

    # Make Predictions

    probs = []
    for model_inputs, _ in tqdm(inference_generator):
        x = torch.from_numpy(model_inputs).float().to(device)
        preds = model(x).cpu().detach().numpy().squeeze()
        if len(preds.shape) == 0:
            preds = [float(preds)]
        else:
            preds = list(preds)
        probs += preds
    probs = np.array(probs)

    file_length = audio_utils.get_audio_length(audio_path)

    fps = len(probs)/float(file_length)

    probs = laugh_segmenter.lowpass(probs)
    instances = laugh_segmenter.get_laughter_instances(
        probs, threshold=threshold, min_length=float(min_length), fps=fps)
    return instances


@app.route("/", methods=['POST', 'GET'])
def show_index_page():
    if request.method == "POST":
        samplerate = 48000

        f = request.files['audio_data']
        with open('./file.wav', 'wb') as audio:
            f.save(audio)
        print('File file.wav saved.')

        print('Running analysis on the file...')
        instances_of_laughter = run_laughter_detection(audio_path='./file.wav')
        print()
        print("found %d laughs." % (len(instances_of_laughter)))
        laughter_detected = False
        if len(instances_of_laughter) > 0:
            laughter_detected = True
        return_data = {'laughterDetected': laughter_detected}
        return jsonify(return_data)
    else:
        return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True)
