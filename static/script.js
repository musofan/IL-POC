
var categories = {
	0: "Outside study area",
	1: "Retail",
	2: "Food and beverage",
	3: "Attraction",
	4: "Other business",
	5: "Specific place",
	6: "General region",
};

var sizeFactor = .2;
var sizeMultiplier = 10;
var sizeMin = 0;
var barWidth = 8;

var weekIndex = 0;

var tooltip = d3.select("div.tooltip");
var tooltip_title = d3.select("#title");
var tooltip_detail = d3.select("#detail");

var topLeft = [0,0], bottomRight = [0,0];

var map = L.map('map').setView([39.8934, 116.384390666], 16);

L.tileLayer('https://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={accessToken}', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	mapid: 'mapbox.light',
	accessToken: 'pk.eyJ1IjoiZGFuaWxuYWd5IiwiYSI6ImVobm1tZWsifQ.CGQL9qrfNzMYtaQMiI-c8A'
}).addTo(map);

//create variables to store a reference to svg and g elements

// white overlay
var mapVisible = true;

var svg_overlay = d3.select(map.getPanes().overlayPane).append("svg");

svg_overlay
	.attr("class", "map_overlay")
	.attr("width", "10000px")
	.attr("height", "10000px")
	.style("left", "-1000px")
	.style("top", "-1000px")
	.attr("display", "none") // toggle this value to turn map on and off
	;

svg_overlay.append("rect")
	.attr("class", "overlay")
	.attr("width", "100%")
	.attr("height", "100%")
	;


// markers
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");

// slider
var div_slider = d3.select("body").append("div").attr("class", "slider");

// semantic ui
var semanticVisible = true;
// select ui div from .html file
// var div_semanticUI = d3.select("div.semantic");

if (semanticVisible == true){
	$(".semantic").fadeIn();
	// div_semanticUI.style("visibility", "hidden");
}

//HELPER FUNCTIONS

//properties for marker updates
function rect_getProperty(property, d, weekIndex){

	weekIndex = typeof weekIndex !== 'undefined' ? weekIndex : 0;

	if (property == "radius"){
		if (weekIndex == 0){
			return Math.pow(d.properties.count,sizeFactor) * sizeMultiplier/1.5 + sizeMin;
		} else {
			return Math.pow(d.properties.weeklyCounts[weekIndex],sizeFactor) * sizeMultiplier + sizeMin;
		}
	}

	if (property == "position"){
		var radius = rect_getProperty("radius", d, weekIndex);
		var x = projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x - radius/2;
		var y = projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y - radius/2;
		return [x, y]
	}

	if (property == "popularity"){
		var radius = rect_getProperty("radius", d, weekIndex);
		var x = projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x - barWidth/2;
		var val = Math.pow(d.properties.countNorm,sizeFactor);
		var y = bottomRight[1] - (val * (bottomRight[1]-topLeft[1])) - radius/2;
		return [x, y]
	}
}

//function for updating marker display
function updateMarkers(duration){

	duration = typeof duration !== 'undefined' ? duration : 500;

	if (mapVisible == false){
		g.selectAll("rect")
			.transition()
			.duration(duration)
			.attr("x", function(d) { return rect_getProperty("popularity", d, weekIndex)[0]; })
			.attr("y", function(d) { return rect_getProperty("popularity", d, weekIndex)[1]; })
			.attr("rx",0)
			.attr("ry",0)
			.attr("width", barWidth)
			.attr("height", function(d) { return rect_getProperty("radius", d, weekIndex); })
		;
	} else {
		g.selectAll("rect")
			.transition()
			.duration(duration)
			.attr("x", function(d) { return rect_getProperty("position", d, weekIndex)[0];  })
			.attr("y", function(d) { return rect_getProperty("position", d, weekIndex)[1];  })
			.attr("height", function(d) { return rect_getProperty("radius", d, weekIndex); })
			.attr("width", function(d) { return rect_getProperty("radius", d, weekIndex); })
			.attr("rx", function(d) { return rect_getProperty("radius", d, weekIndex) / 2; })
			.attr("ry", function(d) { return rect_getProperty("radius", d, weekIndex) / 2; })
		;
	}

}

//adjusts markers by slider
function updateMarkersBySlider(week){
	document.querySelector('#weekSelected').value = week
	weekIndex = week

	updateMarkers();
};

//adjusts visibility of semantic interface
function toggleSemantic(){
	if (semanticVisible == true){
		$(".semantic").fadeOut();
		// div_semanticUI.style("visibility", "hidden");
		semanticVisible = false;
	} else {
		// div_semanticUI.style("visibility", "visible");
		$(".semantic").fadeIn();
		semanticVisible = true;
	}
}

//adjusts map visibility
function toggleMap(){
	if (semanticVisible == true){
		return null
	}
	if (mapVisible == true){
		$(".map_overlay").fadeIn();
		// svg_overlay.attr("visibility", "visible");
		mapVisible = false;
	} else {
		$(".map_overlay").fadeOut();
		// svg_overlay.attr("visibility", "hidden");
		mapVisible = true;
	}
	updateMarkers(duration = 1000);
}

//keyboard handling
//http://stackoverflow.com/questions/4954403/can-jquery-keypress-detect-more-than-one-key-at-the-same-time
var keys = {};

$(document).keydown(function (e) {
    keys[e.which] = true;
    checkKeys(e);
});

$(document).keyup(function (e) {
    delete keys[e.which];
});

function checkKeys(e) {
	//if both ctrl and space is pressed, toggle semantic interface
	if (keys.hasOwnProperty(17) && keys.hasOwnProperty(32)){
		toggleSemantic();
	}
}


function projectPoint(lat, lng) {
	return map.latLngToLayerPoint(new L.LatLng(lat, lng));
}

function projectStream(lat, lng) {
	var point = projectPoint(lat,lng);
	this.stream.point(point.x, point.y);
}

var transform = d3.geo.transform({point: projectStream});
var path = d3.geo.path().projection(transform);

function updateData(){

	request = "/getData"
	d3.json(request, function(data) {

		//create placeholder marker geometry and bind it to data
		var markers = g.selectAll("rect").data(data.features);

		console.log(data);

		markers.enter()
			.append("rect")
			.on("mouseover", function(d){
				tooltip.style("visibility", "visible");
				tooltip_title.text(d.properties.name);
				tooltip_detail.text(categories[d.properties.cat]);
			})
			.on("mousemove", function(){
				tooltip.style("top", (d3.event.pageY-10)+"px")
				tooltip.style("left",(d3.event.pageX+10)+"px");
			})
			.on("mouseout", function(){
				tooltip.style("visibility", "hidden");
			})
			.attr("class", "marker")
			.attr("fill", function(d) { return colors.Spectral[7][d.properties.cat]; })
		;

		// call function to update geometry
		update();
		map.on("viewreset", update);

		// function to update the data
		function update() {

			// get bounding box of data
			var bounds = path.bounds(data);
			topLeft = bounds[0];
			bottomRight = bounds[1];

			var buffer = 50;

			// reposition the SVG to cover the features.
			svg .attr("width", bottomRight[0] - topLeft[0] + (buffer * 2))
				.attr("height", bottomRight[1] - topLeft[1] + (buffer * 2))
				.style("left", (topLeft[0] - buffer) + "px")
				.style("top", (topLeft[1] - buffer) + "px");

			g   .attr("transform", "translate(" + (-topLeft[0] + buffer) + "," + (-topLeft[1] + buffer) + ")");

			updateMarkers(duration = 0);

		};
	});
};

updateData();


//semantic UI autocomplete

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var content = ['business popularity'];

$('#semantic_form .content').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'content',
  source: substringMatcher(content)
});

var context = ['Dashilar'];

$('#semantic_form .context').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'context',
  source: substringMatcher(context)
});

var insight = ['investment in BJDW'];

$('#semantic_form .insight').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'insight',
  source: substringMatcher(insight)
});



