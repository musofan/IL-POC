import time
import datetime
from dateutil import parser
import csv
import sys
import requests
import json
import math
import os
import random
from os import walk
import pickle

workingDirectory = os.path.dirname(os.path.abspath(__file__))

counts = {}

delim = ';'

placesData = {}

with open(workingDirectory +  "\\dashilar.txt", 'r') as f:
	data = f.read().strip()
	entries = data.split("\n")
	entries.pop(0)

for entry in entries:
	features = entry.split(delim)
	place_id = features[0]

	print "processing:", place_id, features[6]

	placesData[place_id] = {'lat': features[15], 'lng': features[16], 'cat': features[5], 'title': features[6], 'count': features[21]}

	# GET WEIBO DATA
	poiids = [features[1], features[2]]
	for poiid in poiids:
		# break

		if poiid == "":
			continue

		fileName = "weiboUsers_" + poiid + ".txt"

		with open(workingDirectory +  "\\Weibo\\04_checkins\\" + fileName, 'r') as poiid_f:

			poiid_data = poiid_f.read().strip()

			poiid_entries = poiid_data.split("\n")
			poiid_entries.pop(0)

			if len(poiid_entries) == 0:
				print "no checkins", poiid
				continue

			if place_id not in counts.keys():
				counts[place_id] = {}

			for poiid_entry in poiid_entries:
				poiid_features = poiid_entry.split(";")

				date = parser.parse(poiid_features[0])
				DOY = int(date.strftime('%j'))
				DOW = int(date.strftime('%w'))

				dateTag = date.strftime('%y-%m-%d')
				if dateTag not in counts[place_id].keys():
					counts[place_id][dateTag] = 0

				counts[place_id][dateTag] += 1


	# GET DIANPING DATA
	dianping_ids = [features[3], features[4]]
	for dianping_id in dianping_ids:

		if dianping_id == "":
			continue
		
		fileName = "" + dianping_id + ".txt"

		with open(workingDirectory +  "\\Dianping\\02_reviews\\" + fileName, 'r') as dianping_f:

			dianping_data = dianping_f.read().strip()

			dianping_entries = dianping_data.split("\n")
			dianping_entries.pop(0)

			if len(dianping_entries) == 0:
				print "no reviews", dianping_id
				continue

			if place_id not in counts.keys():
				counts[place_id] = {}

			for i, dianping_entry in enumerate(dianping_entries):

				dianping_features = dianping_entry.split(";")
				date_sections = dianping_features[0].split('-')

				dateList = []

				for date_section in date_sections:
					if len(date_section) == 2:
						dateList.append(date_section)
					else:
						dateList.append(date_section[:2])
						break

				if len(dateList) < 3:
					dateList.insert(0, '16')

				date = datetime.datetime.strptime("-".join(dateList), '%y-%m-%d')
				DOY = int(date.strftime('%j'))
				DOW = int(date.strftime('%w'))

				dateTag = date.strftime('%y-%m-%d')
				if dateTag not in counts[place_id].keys():
					counts[place_id][dateTag] = 0

				counts[place_id][dateTag] += 1


# sort place id's
ids = counts.keys()
ids = [int(x) for x in ids]
ids.sort()
ids = [str(x) for x in ids]
# print ids

print "number of places:", len(counts.keys())
# print sum([counts[ids[1]][x] for x in counts[ids[1]].keys()])


# generate weekly dataset
dataSet = "ID;title;cat;lat;lng;count;weeks\n"

#get weekly counts
for _id in ids:

	# s1 = ";".join([_id, placesData[_id]['title'], placesData[_id]['cat'], placesData[_id]['lat'], placesData[_id]['lng'], placesData[_id]['count']])
	s1 = ";".join([_id, placesData[_id]['title'], placesData[_id]['cat'], placesData[_id]['lat'], placesData[_id]['lng']])

	timeSet = [0] * 52

	count_2015 = 0

	for key in counts[_id].keys():

		date = datetime.datetime.strptime(key, '%y-%m-%d')
		# DOY = int(date.strftime('%j'))
		# DOW = int(date.strftime('%w'))
		year = int(date.strftime('%Y'))

		if year == 2015:
			WOY = int(date.strftime('%U'))
			if WOY == 0:
				WOY = 1
			if WOY == 53:
				WOY = 52

			timeSet[WOY-1] += 1
			count_2015 += 1

	s1 += ";" + str(count_2015)

	s2 = ";".join([str(x) for x in timeSet])

	dataSet += s1 + ";" + s2 + "\n"

print "number of datapoints:", len(dataSet.split("\n"))
# print dataSet[0]

with open(workingDirectory + "\\dashilar_data.txt", 'wb') as f:
	f.write(dataSet)



# generate daily category counts
categories = [1,2,3,4,5,6]


category_counts = {}

for cat in categories:
	category_counts[cat] = [0] * 365

dataSet = ";".join([str(x) for x in categories]) + "\n"

# get daily category counts
for _id in ids:

	cat =  int(placesData[_id]['cat'])

	for key in counts[_id].keys():

		date = datetime.datetime.strptime(key, '%y-%m-%d')
		# DOY = int(date.strftime('%j'))
		# DOW = int(date.strftime('%w'))
		year = int(date.strftime('%Y'))

		if year == 2015:
			DOY = int(date.strftime('%j'))
			category_counts[cat][DOY-1] += 1

for day in range(365):
	data = []
	for cat in categories:
		data.append(category_counts[cat][day])

	dataSet += ";".join([str(x) for x in data]) + "\n"


with open(workingDirectory + "\\dashilar_data_categoryCounts.txt", 'wb') as f:
	f.write(dataSet)
