from flask import Flask
from flask import render_template
from flask import request
from flask import Response

import json
import time
import sys
import random
import math

#import pyorient

from Queue import Queue

#from sklearn import preprocessing
#from sklearn import svm

import random

import numpy as np
import os

currentDirectory = os.path.dirname(os.path.abspath(__file__)) + "//"

app = Flask(__name__)

# q = Queue()

def point_distance(x1, y1, x2, y2):
	return ((x1-x2)**2.0 + (y1-y2)**2.0)**(0.5)

def remap(value, min1, max1, min2, max2):
	return float(min2) + (float(value) - float(min1)) * (float(max2) - float(min2)) / (float(max1) - float(min1))

def normalizeArray(inputArray):
	maxVal = 0
	minVal = 100000000000

	for j in range(len(inputArray)):
		for i in range(len(inputArray[j])):
			if inputArray[j][i] > maxVal:
				maxVal = inputArray[j][i]
			if inputArray[j][i] < minVal:
				minVal = inputArray[j][i]

	for j in range(len(inputArray)):
		for i in range(len(inputArray[j])):
			inputArray[j][i] = remap(inputArray[j][i], minVal, maxVal, 0, 1)

	return inputArray

# def event_stream():
#     while True:
#         result = q.get()
#         yield 'data: %s\n\n' % str(result)

# @app.route('/eventSource/')
# def sse_source():
#     return Response(
#             event_stream(),
#             mimetype='text/event-stream')

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/getPrediction/")
def getPrediction():

	fileName = "dashilar_data.txt"

	with open(currentDirectory +  "analysis//" + fileName, 'r') as f:
		records = f.readlines()
		records = [x.strip() for x in records]
		titles = records.pop(0).split(';')

	# iterate through data to find minimum and maximum price
	minCount = 1000000000
	maxCount = 0

	counts = []

	for record in records:
		features = record.split(';')
		count = int(features[titles.index('count')])

		counts.append(count)

		if count > maxCount:
			maxCount = count
		if count < minCount:
			minCount = count


	sorted_order = [x for (y,x) in sorted(zip(counts,range(len(counts))), key=lambda pair: pair[0])]


	output = {"type":"FeatureCollection","features":[]}

	for i, record in enumerate(records):
		features = record.split(';')
		point = {"type":"Feature","properties":{},"geometry":{"type":"Point"}}
		point["id"] = features[titles.index('ID')]
		point["properties"]["name"] = features[titles.index('title')]
		point["properties"]["cat"] = features[titles.index('cat')]
		point["properties"]["count"] = features[titles.index('count')]
		point["properties"]["countNorm"] = remap(features[titles.index('count')], minCount, maxCount, 0, 1)
		point["properties"]["order"] = sorted_order.index(i)

		count = int(features[titles.index('count')])

		dummyPrediction = [count] * 20
		dummyPrediction = [x + ((count/10+10) * (.5-random.random())) for x in dummyPrediction]

		point["properties"]["prediction"] = dummyPrediction
		point["geometry"]["coordinates"] = [float(features[titles.index('lat')]), float(features[titles.index('lng')])]

		output["features"].append(point)
	return json.dumps(output)


@app.route("/getData/")
def getData():

	fileName = "dashilar_data.txt"

	with open(currentDirectory +  "analysis//" + fileName, 'r') as f:
		records = f.readlines()
		records = [x.strip() for x in records]
		titles = records.pop(0).split(';')
	print titles

	print len(records)

	# iterate through data to find minimum and maximum price
	minCount = 1000000000
	maxCount = 0

	for record in records:
		features = record.split(';')
		count = int(features[titles.index('count')])

		if count > maxCount:
			maxCount = count
		if count < minCount:
			minCount = count

	print minCount
	print maxCount

	output = {"type":"FeatureCollection","features":[]}

	for record in records:
		features = record.split(';')
		point = {"type":"Feature","properties":{},"geometry":{"type":"Point"}}
		point["id"] = features[titles.index('ID')]
		point["properties"]["name"] = features[titles.index('title')]
		point["properties"]["cat"] = features[titles.index('cat')]
		point["properties"]["count"] = features[titles.index('count')]
		point["properties"]["countNorm"] = remap(features[titles.index('count')], minCount, maxCount, 0, 1)
		point["properties"]["weeklyCounts"] = features[6:(6+52)]
		point["geometry"]["coordinates"] = [float(features[titles.index('lat')]), float(features[titles.index('lng')])]

		output["features"].append(point)

	return json.dumps(output)

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True,threaded=True)
