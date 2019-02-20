function createMap(){
    //create the map
    var map = new L.map('mapid').setView([37.8, -96], 4);
    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map)
	// Create legend
	 var legend = L.control({position: 'bottomright'});
	
	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
		    grades = [0, 1000000, 1500000, 2000000, 2500000, 3000000, 3250000],
		    labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
	
    //call ajax function
    getData(map);
};

//update points when slider is pressed
function updatePropSymbols(map,attribute){
    //Update points 
    map.eachLayer(function(layer){
        if(layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            var color = getColor(props[attribute]);
	    var options = {
                radius: 8,
                color: "#000",
                weight: 1,
                opacity: 1, 
                fillOpacity: 0.8,
		fillColor: color
                	};
            layer.setStyle(options);
	    //Refresh pop ups
            var year = attribute.split("_")[1];
            var popupContent = "<p><b>Stadium:</b> " +props.Stadium + "</p>";
            popupContent += "<p><b>Team:</b> " +props.Team + "</p>";
			var panelContent = "<p><b>Attendance in " + year + ":</b> "+ props[attribute] + "</p>";
            layer.bindPopup(popupContent,{
                offest: new L.point(0,-color)
            });
			
			layer.on({
			mouseover: function(){
				this.openPopup();
				},
			mouseout: function(){
				this.closePopup();
				},
			click: function(){
				$("#popupPanel").html(panelContent);
				}
			});
			
        };
    });
};
//Create slider and buttons
function createSquenceControls(map, attributes){
    //Create Slider
    $("#panel").append('<input class="range-slider" type="range">');
    $('.range-slider').attr({
        max: 7,
        min: 0,
        value: 0,
        step: 1
    });
    //Create forward and reverse buttons
    $('#reverse').append('<button class="skip" id="reverse">Reverse</button>');
    $('#forward').append('<button class="skip" id="forward">Forward</button>');
    
    //Get value from slider
    $('.skip').click(function(){
        var index = $('.range-slider').val();
        //Increase value on forward button press
        if ($(this).attr('id') == 'forward'){
            index++;
	    //If value goes above 7 then it resets to 0
            index = index > 7 ? 0: index;
	  //Decrease value on reverse press
        } else if ($(this).attr('id') == 'reverse'){
            index--;
	    //If value goes below 0 then it goes to 7
            index = index < 0 ? 7: index;
        };
	 //Use value from buttons to run updatePropSymbols.
        $('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
    });
    //Use value selected from slider to run updatePropSymbosl
    $('.range-slider').on('input',function(){
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
    });
   
};

function processData(data){
    var attributes = [];
    
    var properties = data.features[0].properties;
    
    for(var attribute in properties){
        if(attribute.indexOf("Attend")>-1){
            attributes.push(attribute);
        };
    };
    console.log(attributes);
    
    return attributes;
}
//Create ranges of colors based on Attendance value
function getColor(d) {
    return d > 3250000 ? '#800026' :
    d > 3000000  ? '#BD0026' :
    d > 2500000  ? '#E31A1C' :
    d > 2000000  ? '#FC4E2A' :
    d > 1500000  ? '#FD8D3C' :
    d > 1000000  ? '#FEB24C' :
    d > 800000  ? '#FED976' :
    '#FFEDA0';
	};

//Create points to layer attributes and functions for geoJson Layer
function pointToLayer(feature, latlng, attributes){
	
    //Attributes intialized at 0 postions in array.
    var attribute = attributes[0];
    console.log(attribute);
	
    //Create options for points layer
    var geojsonMarkerOptions = {
                radius: 8,
                color: "#000",
                weight: 1,
                opacity: 1, 
                fillOpacity: 0.8
                };
    //Get number value of Attributes property	
    var attValue = Number(feature.properties[attribute]);
    
    //Create point color based on Attribute value
    geojsonMarkerOptions.fillColor = getColor(attValue);
    
    //Create circel markers and assign attributes
    var layer = L.circleMarker(latlng,geojsonMarkerOptions);
    
    //Extraxt year value from attribute
    var year = attribute.split("_")[1];
    
    //Create popUpContent for circle Markers
    var popupContent ="<p><b>Stadium:</b> "+ feature.properties.Stadium + "</p>";
    popupContent += "<p><b>Team:</b> "+feature.properties.Team + "</p>";
    //Create content for panel 	
    var panelContent = "<p><b>Population in " + year + ":</b> "+feature.properties[attribute] + "</p>";
    //add popup content to points	
    layer.bindPopup(popupContent);
    //Make pop up content viewble once point is hovered over.
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
	//add panelContent once point is clicked
        click: function(){
            $("#popupPanel").html(panelContent);
        }
    });
    
    return layer;
};

//Create Geojson Layer and marker cluster
function createColorSymbols(data, map,attributes){
     //Intialize marker cluster object
     var markers = new L.MarkerClusterGroup();
     //Create geoJson layer and pointToLayer options
     var geoJson = L.geoJson(data, {
                pointToLayer: function(feature, latlng){
					return pointToLayer(feature,latlng,attributes);
				}
            });
       //Add geojsonLayer to markerclustergroup
       markers.addLayer(geoJson);
       map.addLayer(markers);
};
//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/stadiums.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            console.log(String(attributes[0]));
            //create basic marker options
	    createSquenceControls(map, attributes);
            createColorSymbols(response, map, attributes);
			console.log(map);
            
            
            //create a Leaflet GeoJSON layer and add it to the map
            
        }
    });
};

$(document).ready(createMap);
