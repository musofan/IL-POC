
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


// helper function to retrieve query string
// function getParameterByName(name, url) {
//     if (!url) url = window.location.href;
//     url = url.toLowerCase(); // This is just to avoid case sensitiveness  
//     name = name.replace(/[\[\]]/g, "\\$&");
//     var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
//         results = regex.exec(url);
//     if (!results) return null;
//     if (!results[2]) return '';
//     return decodeURIComponent(results[2].replace(/\+/g, " "));
// }

// var query1 = getParameterByName("content")
// var query2 = getParameterByName("context")
// var query3 = getParameterByName("insight")


// semantic ui
var semanticVisible = true;

// white overlay
var mapVisible = true;


var map = L.map('map').setView([39.8934, 116.384390666], 16);

L.tileLayer('https://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={accessToken}', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	mapid: 'mapbox.light',
	accessToken: 'pk.eyJ1IjoiZGFuaWxuYWd5IiwiYSI6ImVobm1tZWsifQ.CGQL9qrfNzMYtaQMiI-c8A'
}).addTo(map);

//create variables to store a reference to svg and g elements


var svg_overlay = d3.select(map.getPanes().overlayPane).append("svg");

svg_overlay
	.attr("class", "map_overlay")
	.attr("width", "10000px")
	.attr("height", "10000px")
	.style("left", "-1000px")
	.style("top", "-1000px")
	;

svg_overlay.append("rect")
	.attr("class", "overlay")
	.attr("width", "100%")
	.attr("height", "100%")
	;


// markers
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");


if (semanticVisible == true){
	$(".semantic").fadeIn();
	$(".desktop").css('display', 'none');
}

if (mapVisible == true){
	$(".map_overlay").fadeOut();
}



var brush
var timeFormat = d3.time.format('%Y-%m-%dT%H:%M:%S');
var weekIndexFormat = d3.time.format('%j')

function makeSlider(){

	var div_slider = d3.select(".slider");

	var margin = {top: 10, right: 10, bottom: 20, left: 10};

	var width = $('.slider').width()-(margin.left+margin.right);
	var height = $('.slider').height()-(margin.top+margin.bottom);

	var x = d3.time.scale()
	    .domain([timeFormat.parse('2015-01-01T00:00:00'), timeFormat.parse('2015-12-31T00:00:00')])
	    .range([0, width]);

	brush = d3.svg.brush()
	    .x(x)
	    .extent([timeFormat.parse('2015-01-01T00:00:00'), timeFormat.parse('2015-01-07T00:00:00')])
	    .on("brushend", brushended);

	var svg_slider = div_slider.append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg_slider.append("rect")
	    .attr("class", "grid-background")
	    .attr("width", width)
	    .attr("height", height);

	svg_slider.append("g")
	    .attr("class", "x grid")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.svg.axis()
	        .scale(x)
	        .orient("bottom")
	        .ticks(d3.time.thursday, 1)
	        .tickSize(-height)
	        .tickFormat(""))
	  .selectAll(".tick")
	    .classed("minor", function(d) { return d.getHours(); });

	svg_slider.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.svg.axis()
	      .scale(x)
	      .orient("bottom")
	      .ticks(d3.time.months)
	      .tickPadding(0))
	  .selectAll("text")
	    .attr("x", 6)
	    .style("text-anchor", null);

	var gBrush = svg_slider.append("g")
	    .attr("class", "brush")
	    .call(brush)
	    .call(brush.event);

	gBrush.selectAll("rect")
	    .attr("height", height);

}

function brushended() {
  if (!d3.event.sourceEvent) return; // only transition after input
  var extent0 = brush.extent(),
      extent1 = extent0.map(d3.time.thursday.round);

  // if empty when rounded, use floor & ceil instead
  if (extent1[0] >= extent1[1]) {
    extent1[0] = d3.time.thursday.floor(extent0[0]);
    extent1[1] = d3.time.thursday.ceil(extent0[1]);
  }

  d3.select(this).transition()
      .call(brush.extent(extent1))
      .call(brush.event);

	var extent2 = (extent1.map(function (d) {return Math.floor(weekIndexFormat(d)/7+1)}));

	updateMarkersBySlider(extent2[0]);

	console.log(extent2[0])
	console.log(extent2[1])
}

// semantic ui
// var semanticVisible = false;


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
	// document.querySelector('#weekSelected').value = week
	weekIndex = week
	updateMarkers();
};

//adjusts visibility of semantic interface
function toggleSemantic(){
	if (semanticVisible == true){
		var option1 = $('.tt-input.content').typeahead('val');
		var option2 = $('.tt-input.context').typeahead('val');
		var option3 = $('.tt-input.insight').typeahead('val');
		console.log(option1, option2, option3)

		if (option1 == "business popularity" && option2 == "Dashilar") {
			$(".desktop").css('display', 'inline');
			$(".semantic").fadeOut();
			semanticVisible = false;

			if (option3 == "investment in BJDW") {
				toggleMap();
			}
			if ($("#option3").css("display") == "none"){
				updateData();
				makeSlider();
			}
		}


	} else {
		// div_semanticUI.style("visibility", "visible");
		$(".semantic").fadeIn();
		$("#option3").fadeIn();
		$(".insight").focus();
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
	// console.log(e.which)
	//if both ctrl and space is pressed, toggle semantic interface
	// if (keys.hasOwnProperty(17) && keys.hasOwnProperty(32)){
	// 	toggleSemantic();
	// }
	if (keys.hasOwnProperty(13)){
		toggleSemantic();
	}
	if (keys.hasOwnProperty(16) && keys.hasOwnProperty(32)){
		toggleMap();
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

// updateData();


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



