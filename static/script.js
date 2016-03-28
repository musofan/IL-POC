
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
var buffer = 50;


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
var svg = d3.select(map.getPanes().overlayPane).append("svg").attr("class", "marker_svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");

//slider and area charts
var brush
var timeFormat = d3.time.format('%j');
var parseDate = d3.time.format('%m-%d-%Y').parse;

function makeSlider(){

	var div_slider = d3.select(".slider");

	var margin = {top: 10, right: 0, bottom: 20, left: 10};

	var width = $('.slider').width()-(margin.left+margin.right);
	var height = $('.slider').height()-(margin.top+margin.bottom);

	var x = d3.time.scale()
	    .domain([parseDate('01-01-2015'), parseDate('12-31-2015')])
	    .range([0, width]);

	var y = d3.scale.linear()
			.range([height, 0]);

	brush = d3.svg.brush()
		.x(x)
		.extent([parseDate('01-01-2015'),parseDate('01-07-2015')])
		.on("brushend", brushended);

	var svg_slider = div_slider
		// .classed("svg-container", true)
		.append("svg")
		// .attr("preserveAspectRatio", "xMinYMin meet")
		// .attr("preserveAspectRatio", "none")
		// .attr("viewBox", "0 0 " + width + " " + height)
		// .attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		// .classed("svg-content-responsive", true)
		;

	var g_slider = svg_slider
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	;

	type = d3.scale.ordinal();

	var area = d3.svg.area()
		.interpolate("monotone")
		.x(function(d) { return x(d.date); })
		.y0(function(d) { return y(d.y0); })
		.y1(function(d) { return y(d.y0 + d.y); })
	;

	var stack = d3.layout.stack()
		.values(function(d) { return d.values; });

	var line = d3.svg.line()
			.interpolate("monotone")
			.x(function(d) { return x(d.date);})
			.y(function(d) { return y(d.y0+d.y); });

	//CSV function generates charts and gridlines
	d3.csv("./static/dashilar_data_categoryCounts_withDate.csv", function(error, data2) {

		if (error) throw error;

		type.domain(d3.keys(data2[0]).filter(function(key) { return key !== "date"; }));

		data2.forEach(function(d) {
			d.date = parseDate(d.date);
		});

		var areaGraphs = stack(type.domain().map(function(name) {
			return {
				name: name,
				values: data2.map(function(d) {
					return {date: d.date, y: +d[name]};
				})
			};
		}));

		y.domain([0, 30]);

		var areaGraph = g_slider.selectAll(".areaGraph")
			.data(areaGraphs)
			.enter().append("g")
			.attr("class", "areaGraph");

		areaGraph.append("path")
		  .attr("class", "area")
		  .attr("d", function(d) { return area(d.values); })
		  .style("fill", function(d) { return colors.Spectral[7][d.name]; });

		var areaGraphLine = g_slider.selectAll(".areaGraphLine")
			.data(areaGraphs)
			.enter().append("g")
			.attr("class", "areaGraphLine");

		areaGraphLine.append("path")
			.attr("class", "line")
 			.attr("d", function(d) { return line(d.values); })
			.style("stroke", function(d) { return colors.Spectral[7][d.name]; });
	});


	var slider_rec = g_slider.append("rect")
		.attr("class", "grid-background")
		.attr("height", height);

	var slider_grid = g_slider.append("g")
		.attr("class", "x grid")
		.attr("transform", "translate(0," + height + ")")
	;

	var slider_axis = g_slider.append("g")
		.attr("class", "x axis")
		.on("click", function(){
			svg_slider.select(".brush")
				.transition()
				.call(brush.extent([parseDate('01-01-2015'), parseDate('12-30-2015')]));
				extent2 = [0,52];
				updateMarkersBySlider(extent2);
			})
		.attr("transform", "translate(0," + height + ")")
	;

	slider_axis.selectAll("text")
		.attr("x", 6)
		.style("text-anchor", null);

	var gBrush = g_slider.append("g")
		.attr("class", "brush")
		.call(brush)
		.call(brush.event)
	;

	gBrush.selectAll("rect")
		.attr("height", height);


	d3.select(window).on('resize', resize); 
	resize();

	function resize(){
		width = $('.slider').width()-(margin.left+margin.right);
		svg_slider.attr("width", width);

		x.range([0, width]);

		slider_rec.attr("width", width);

		slider_grid.call(d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(d3.time.thursday)
			.tickSize(-height)
			.tickFormat("")
		);

		slider_axis.call(d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(d3.time.months)
			.tickFormat(d3.time.format("%b"))
			.tickPadding(0)
		);

		gBrush.call(brush)
			.call(brush.event)
		;

		g_slider.selectAll(".area")
			.attr("d", function(d) { return area(d.values); })
		;

		g_slider.selectAll(".line")
			.attr("d", function(d) { return area(d.values); })
		;
	}

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

	var extent2 = (extent1.map(function (d) {return Math.floor(timeFormat(d)/7)}));

	updateMarkersBySlider(extent2);
}

var semanticActive = false; //toggle to active semantic UI walkthrough

if (semanticActive == false){
	$(".desktop").css('display', 'inline');
	$(".semantic").fadeOut();
	semanticVisible = false;

	getData();
	makeSlider();

}

if (semanticVisible == true){
	$(".semantic").fadeIn();
	$(".desktop").css('display', 'none');
}

if (mapVisible == true){
	$(".map_overlay").fadeOut();
}


//HELPER FUNCTIONS

//properties for marker updates
function rect_getProperty(property, d, weekIndex){

	weekIndex = typeof weekIndex !== 'undefined' ? weekIndex : 0;

	if (property == "radius"){
		if (weekIndex == 0){
			return Math.pow(d.properties.count,sizeFactor) * sizeMultiplier/1.5 + sizeMin;
		} else {
			sum = 0;
			subset = d.properties.weeklyCounts.slice(weekIndex[0],weekIndex[1]);
			for (var i = 0; i < subset.length; i++) {
				sum += parseInt(subset[i]);
			}
			return Math.pow(sum,sizeFactor) * sizeMultiplier + sizeMin;
		}
	}

	if (property == "prediction"){

		max = Math.max.apply(null,d.properties.prediction);
		min = Math.min.apply(null,d.properties.prediction);
		med = (max + min) / 2;
		return [max-min, med]
	}

	if (property == "position_exploration"){
		var radius = rect_getProperty("radius", d, weekIndex);
		var x = projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x - radius/2;
		var y = projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y - radius/2;
		return [x, y]
	}

	if (property == "position_insight"){
		var med = rect_getProperty("prediction", d, weekIndex)[1];

		var w = $('#map').width()
		var h = $('#map').height()

		var x = d.properties.order * (w/180);
		var y = h - (med/400 * h) - 20;
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
			.attr("x", function(d) { return rect_getProperty("position_insight", d, weekIndex)[0]; })
			.attr("y", function(d) { return rect_getProperty("position_insight", d, weekIndex)[1]; })
			.attr("rx",0)
			.attr("ry",0)
			.attr("width", barWidth)
			.attr("height", function(d) { return rect_getProperty("prediction", d, weekIndex)[0]; })
			.attr("fill-opacity", 0.2)
		;
	} else {
		g.selectAll("rect")
			.transition()
			.duration(duration)
			.attr("x", function(d) { return rect_getProperty("position_exploration", d, weekIndex)[0];  })
			.attr("y", function(d) { return rect_getProperty("position_exploration", d, weekIndex)[1];  })
			.attr("height", function(d) { return rect_getProperty("radius", d, weekIndex); })
			.attr("width", function(d) { return rect_getProperty("radius", d, weekIndex); })
			.attr("rx", function(d) { return rect_getProperty("radius", d, weekIndex) / 2; })
			.attr("ry", function(d) { return rect_getProperty("radius", d, weekIndex) / 2; })
			.attr("fill-opacity", 0.8)
		;
	}
}

//adjusts markers by slider
function updateMarkersBySlider(weeks){
	// document.querySelector('#weekSelected').value = week
	weekIndex = weeks
	updateMarkers();
};

//adjusts visibility of semantic interface
function toggleSemantic(){
	if (semanticVisible == true){
		var option1 = $('.tt-input.content').typeahead('val');
		var option2 = $('.tt-input.context').typeahead('val');
		var option3 = $('.tt-input.insight').typeahead('val');
		// console.log(option1, option2, option3)

		// toggle for real scenario
		// if (option1 == "business popularity" && option2 == "Dashilar") {
		// 	$(".desktop").css('display', 'inline');
		// 	$(".semantic").fadeOut();
		// 	semanticVisible = false;

		// 	if (option3 == "investment in BJDW") {
		// 		toggleMap();
		// 	}
		// 	if ($("#option3").css("display") == "none"){
		// 		updateData();
		// 		makeSlider();
		// 	}
		// }

		// toggle for development
		$(".desktop").css('display', 'inline');
		$(".semantic").fadeOut();
		semanticVisible = false;
		toggleMap();


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
		// re-center
		map.setView([39.8934, 116.384390666], 16);
		// disable zoom
		map.dragging.disable();
		map.touchZoom.disable();
		map.doubleClickZoom.disable();
		map.scrollWheelZoom.disable();
		map.boxZoom.disable();
		map.keyboard.disable();
		if (map.tap) map.tap.disable();
		document.getElementById('map').style.cursor='default';

		$(".leaflet-control-container").fadeOut();

		updatePrediction();

	} else {
		$(".map_overlay").fadeOut();
		// svg_overlay.attr("visibility", "hidden");
		mapVisible = true;
		// enable zoom
		map.dragging.enable();
		map.touchZoom.enable();
		map.doubleClickZoom.enable();
		map.scrollWheelZoom.enable();
		map.boxZoom.enable();
		map.keyboard.enable();
		if (map.tap) map.tap.enable();
		document.getElementById('map').style.cursor='grab';

		$(".leaflet-control-container").fadeIn();

		updateData();

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

function getData(){

	request = "/getData"
	d3.json(request, function(data) {

		//create placeholder marker geometry and bind it to data
		var markers = g.selectAll("rect").data(data.features);

		// console.log(data);

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

			// reposition the SVG to cover the features.
			repositionSVG();

			updateMarkers(duration = 0);

		};
	});
};

function repositionSVG(){
	svg .attr("width", bottomRight[0] - topLeft[0] + (buffer * 2))
		.attr("height", bottomRight[1] - topLeft[1] + (buffer * 2))
		.style("left", (topLeft[0] - buffer) + "px")
		.style("top", (topLeft[1] - buffer) + "px");

	g   .attr("transform", "translate(" + (-topLeft[0] + buffer) + "," + (-topLeft[1] + buffer) + ")");
}

function updateData(){

	request = "/getData"
	d3.json(request, function(data) {
		// console.log(data);

		g.selectAll("rect").data(data.features);

		updateMarkers(duration = 1000);
		
		repositionSVG();

	});
}

function updatePrediction(){

	request = "/getPrediction"
	d3.json(request, function(data) {
		console.log(data.features[0]);

		g.selectAll("rect").data(data.features);

		svg .attr("width", $('#map').width())
				.attr("height", $('#map').height())
				.style("left", "0px")
				.style("top", "0px");
		g   .attr("transform", "translate(0,0)");

		updateMarkers(duration = 1000);



	});

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
