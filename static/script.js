

// var eventOutputContainer = document.getElementById("message");
// var eventSrc = new EventSource("/eventSource");

// eventSrc.onmessage = function(e) {
// 	console.log(e);
// 	eventOutputContainer.innerHTML = e.data;
// };

//FOR TEMP SLIDER THIS UPDATES THE VALUE DISPLAY ONLY
function sliderUpdate(week) {
	document.querySelector('#weekSelected').value = week;
}

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

var tooltip = d3.select("div.tooltip");
var tooltip_title = d3.select("#title");
var tooltip_count = d3.select("#price");


var map = L.map('map').setView([39.8934, 116.384390666], 16);

//this is the OpenStreetMap tile implementation

// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
// 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

//uncomment for Mapbox implementation, and supply your own access token

L.tileLayer('https://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={accessToken}', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	mapid: 'mapbox.light',
	accessToken: 'pk.eyJ1IjoiZGFuaWxuYWd5IiwiYSI6ImVobm1tZWsifQ.CGQL9qrfNzMYtaQMiI-c8A'
}).addTo(map);

//create variables to store a reference to svg and g elements

// white overlay

var mapVisible = true;

var svg_overlay = d3.select(map.getPanes().overlayPane).append("svg");

svg_overlay.attr("width", "10000px")
	.attr("height", "10000px")
	.style("left", "-1000px")
	.style("top", "-1000px")
	.attr("visibility", "hidden") // toggle this value to turn map on and off
	;

svg_overlay.append("rect")
	.attr("class", "map_overlay")
	.attr("width", "100%")
	.attr("height", "100%")
	;

	function updateMarkersBySlider(week){
		document.querySelector('#weekSelected').value = week
		var weekIndex = week
		console.log(weekIndex)

		if (mapVisible == false){
			g.selectAll("rect")
				.transition()
				.duration(500)
				.attr("height", function(d) { return d.properties.weeklyCounts[weekIndex]; });
	} else{
			g.selectAll("rect")
				.transition()
				.duration(500)
				.attr("height", function(d) { return d.properties.weeklyCounts[weekIndex]*2; })
				.attr("width", function(d) { return d.properties.weeklyCounts[weekIndex]*2; })
				.attr("rx", function(d) { return d.properties.weeklyCounts[weekIndex]*2; })
				.attr("ry", function(d) { return d.properties.weeklyCounts[weekIndex]*2; });
	}
};

function toggleMap(){
	var toggleHeight = window.innerHeight;

	if (semanticVisible == false){
		if (mapVisible == true){
			svg_overlay.attr("visibility", "visible");
			mapVisible = false;

				g.selectAll("rect")
				.transition()
				.duration(1000)
				.attr("rx",0)
				.attr("ry",0)
				.attr("width",20)
				.attr("y", function(d) { return toggleHeight - Math.pow(d.properties.countNorm,sizeFactor)* toggleHeight});

		} else{
			svg_overlay.attr("visibility", "hidden");
			mapVisible = true;

			g.selectAll("rect")
			.transition()
			.duration(1000)
			.attr("y", function(d) { return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y; })
			.attr("rx", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20; })
			.attr("ry", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20; })
			.attr("width", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2; })
			.attr("height", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2; });
		}
	if (semanticVisible == true){
		}
	}
}

// circles

var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");

// slider

var div_slider = d3.select("body").append("div").attr("class", "slider");

// semantic ui

var semanticVisible = false;

var div_semanticUI = d3.select("body").append("div").attr("class", "semantic").style("visibility", "hidden");

function toggleSemantic(){
	if (semanticVisible == true){
		div_semanticUI.style("visibility", "hidden");
		semanticVisible = false;
	}else{
		div_semanticUI.style("visibility", "visible");
		semanticVisible = true;
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

	var mapBounds = map.getBounds();
	var lat1 = mapBounds["_southWest"]["lat"];
	var lat2 = mapBounds["_northEast"]["lat"];
	var lng1 = mapBounds["_southWest"]["lng"];
	var lng2 = mapBounds["_northEast"]["lng"];

	// CAPTURE USER INPUT FOR CELL SIZE FROM HTML ELEMENTS
	var cell_size = 25;
	var w = window.innerWidth;
	var h = window.innerHeight;

	// CAPTURE USER INPUT FOR ANALYSIS TYPE SELECTION
	// var checked = document.getElementById("showOverlay").checked;

	// var list = document.getElementById("typeSelection");
	// var choice = list.options[list.selectedIndex].value;

	// SEND USER CHOICES FOR ANALYSIS TYPE, CELL SIZE, HEAT MAP SPREAD, ETC. TO SERVER
	// request = "/getData?lat1=" + lat1 + "&lat2=" + lat2 + "&lng1=" + lng1 + "&lng2=" + lng2 + "&w=" + w + "&h=" + h + "&cell_size=" + cell_size + "&analysis=" + checked + "&analysisType=" + choice

	request = "/getData"

	console.log(request);

  	d3.json(request, function(data) {

		//create placeholder circle geometry and bind it to data
		var markers = g.selectAll("rect").data(data.features);

		console.log(data);

		markers.enter()
			.append("rect")
			.on("mouseover", function(d){
				tooltip.style("visibility", "visible");
				tooltip_title.text(d.properties.name);
				tooltip_count.text(categories[d.properties.cat]);
			})
			.on("mousemove", function(){
				tooltip.style("top", (d3.event.pageY-10)+"px")
				tooltip.style("left",(d3.event.pageX+10)+"px");
			})
			.on("mouseout", function(){
				tooltip.style("visibility", "hidden");
			})
			.attr("class", "marker")
    		// .attr("fill", function(d) { return "hsl(" + Math.floor((6.0/d.properties.cat)*250) + ", 100%, 50%)"; })
    		.attr("fill", function(d) { return colors.Spectral[7][d.properties.cat]; })
		;

		markers
    			.attr("rx", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20; })
					.attr("ry", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20; })
					.attr("width", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2; })
					.attr("height", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2; });

		// call function to update geometry
		update();
		map.on("viewreset", update);

		// if (checked == true){

		// 	var topleft = projectPoint(lat2, lng1);

		// 	svg_overlay.attr("width", w)
		// 		.attr("height", h)
		// 		.style("left", topleft.x + "px")
		// 		.style("top", topleft.y + "px");

		// 	var rectangles = g_overlay.selectAll("rect").data(data.analysis);
		// 	rectangles.enter().append("rect");

		// 	rectangles
		// 		.attr("x", function(d) { return d.x; })
		// 		.attr("y", function(d) { return d.y; })
		// 		.attr("width", function(d) { return d.width; })
		// 		.attr("height", function(d) { return d.height; })
		//     	.attr("fill-opacity", ".2")
		//     	.attr("fill", function(d) { return "hsl(" + Math.floor((1-d.value)*250) + ", 100%, 50%)"; });

		// };

		// function to update the data
		function update() {

			// g_overlay.selectAll("rect").remove()

			// get bounding box of data
		    var bounds = path.bounds(data),
		        topLeft = bounds[0],
		        bottomRight = bounds[1];

		    var buffer = 50;

		    // reposition the SVG to cover the features.
		    svg .attr("width", bottomRight[0] - topLeft[0] + (buffer * 2))
		        .attr("height", bottomRight[1] - topLeft[1] + (buffer * 2))
		        .style("left", (topLeft[0] - buffer) + "px")
		        .style("top", (topLeft[1] - buffer) + "px");

		    g   .attr("transform", "translate(" + (-topLeft[0] + buffer) + "," + (-topLeft[1] + buffer) + ")");

		    markers
		    	.attr("x", function(d) { return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x; })
		    	.attr("y", function(d) { if (mapVisible == true){
							return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y;}
//							else {return window.innerHeight - Math.pow(d.properties.countNorm,.1)* window.innerHeight;}})
							else {return toggleHeight - Math.pow(d.properties.countNorm,.1)* toggleHeight}
		});
		};
	});
};

updateData();
