

// var eventOutputContainer = document.getElementById("message");
// var eventSrc = new EventSource("/eventSource");

// eventSrc.onmessage = function(e) {
// 	console.log(e);
// 	eventOutputContainer.innerHTML = e.data;
// };

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
var sizeMin = 10;

var tooltip = d3.select("div.tooltip");
var tooltip_title = d3.select("#title");
var tooltip_count = d3.select("#price");



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


//adjusts markers by slider
function updateMarkersBySlider(week){
		document.querySelector('#weekSelected').value = week
		var weekIndex = week

		if (mapVisible == false){
			g.selectAll("rect")
				.transition()
				.duration(500)
				.attr("height", function(d) { return d.properties.weeklyCounts[weekIndex]; });
			} else{
			g.selectAll("rect")
				.transition()
				.duration(500)
				.attr("x", function(d) { 
					var size = Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin;
					return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x - size/2; 
				})
				.attr("y", function(d) { 
					var size = Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin;
					return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y - size/2; 
				})
				.attr("height", function(d) { return Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin; })
				.attr("width", function(d) { return Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin; })
				.attr("rx", function(d) { return Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin; })
				.attr("ry", function(d) { return Math.pow(d.properties.weeklyCounts[weekIndex]/40,sizeFactor) * 20*2 + sizeMin; });
			}
};


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

function toggleMap(){

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
			// .attr("y",20)
			.attr("y", function(d) { 
				var val = Math.pow(d.properties.countNorm,sizeFactor);
				return bottomRight[1] - (val * (bottomRight[1]-topLeft[1]));
			})
			// .attr("y", function(d) { return toggleHeight - Math.pow(d.properties.countNorm,sizeFactor) * toggleHeight})
			;

		} else {
			svg_overlay.attr("visibility", "hidden");
			mapVisible = true;

			g.selectAll("rect")
			.transition()
			.duration(1000)
			.attr("y", function(d) { return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y; })
			.attr("rx", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20 + sizeMin; })
			.attr("ry", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20 + sizeMin; })
			.attr("width", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2 + sizeMin; })
			;
		}
	}
}

var transform = d3.geo.transform({point: projectStream});
var path = d3.geo.path().projection(transform);

function updateData(){

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
			.attr("fill", function(d) { return colors.Spectral[7][d.properties.cat]; })
		;

		markers
			.attr("rx", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20 + sizeMin; })
				.attr("ry", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20 + sizeMin; })
				.attr("width", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2 + sizeMin; })
				.attr("height", function(d) { return Math.pow(d.properties.countNorm,sizeFactor) * 20*2 + sizeMin; })
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

			// g_overlay.selectAll("rect").remove()

			var buffer = 50;

			// reposition the SVG to cover the features.
			svg .attr("width", bottomRight[0] - topLeft[0] + (buffer * 2))
				.attr("height", bottomRight[1] - topLeft[1] + (buffer * 2))
				.style("left", (topLeft[0] - buffer) + "px")
				.style("top", (topLeft[1] - buffer) + "px");

			g   .attr("transform", "translate(" + (-topLeft[0] + buffer) + "," + (-topLeft[1] + buffer) + ")");

			markers
				.attr("x", function(d) { 
					var size = Math.pow(d.properties.countNorm,sizeFactor) * 20*2 + sizeMin;;
					return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).x - size/2; 
				})
				.attr("y", function(d) { 
					if (mapVisible == true){
						var size = Math.pow(d.properties.countNorm,sizeFactor) * 20*2 + sizeMin;;
						return projectPoint(d.geometry.coordinates[0], d.geometry.coordinates[1]).y - size/2; 
					} else {
						var val = Math.pow(d.properties.countNorm,sizeFactor);
						return bottomRight[1] - (val * (bottomRight[1]-topLeft[1]));
					}
				})
				;

		};
	});
};

updateData();
