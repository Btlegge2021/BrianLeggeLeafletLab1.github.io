function createMap(){
    //create the map
    var map = new L.map('mapid').setView([37.8, -96], 4);
    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

function updatePropSymbols(map,attribute){
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
			
            var year = attribute.split("_")[1];
            var popupContent = "<p><b>Stadium:</b> " +props.Stadium + "</p>";
            popupContent += "<p><b>Team:</b> " +props.Team + "</p>";
			var panelContent = "<p><b>Population in " + year + ":</b> "+ props[attribute] + "</p>";
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

function createSquenceControls(map, attributes){
    $("#panel").append('<input class="range-slider" type="range">');
    $('.range-slider').attr({
        max: 7,
        min: 0,
        value: 0,
        step: 1
    });
    $('#reverse').append('<button class="skip" id="reverse">Reverse</button>');
    $('#forward').append('<button class="skip" id="forward">Forward</button>');
    
    $('.skip').click(function(){
        var index = $('.range-slider').val();
        
        if ($(this).attr('id') == 'forward'){
            index++;
            index = index > 7 ? 0: index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            index = index < 0 ? 7: index;
        };
        $('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
    });
    
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

function onEachFeature(feature, layer){
    
    var popupContent = "";
    /*if(feature.properties){
        
        for(var property in feature.properties){
            popupContent += "<p>" + property; //+ ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    }*/
    var attribute = "Attend_2018"
    var year = attribute.split("_")[1];
    popupContent ="<p><b>Stadium:</b> "+ feature.properties.Stadium + "</p>";
    popupContent += "<p><b>Team:</b> "+feature.properties.Team + "</p>";
    popupContent += "<p><b>Population in " + year + ":</b> "+feature.properties[attribute] + "</p>";
    layer.bindPopup(popupContent);
    };

function pointToLayer(feature, latlng, attributes){
    
    var attribute = attributes[0];
    console.log(attribute);
    
  var geojsonMarkerOptions = {
                radius: 8,
                color: "#000",
                weight: 1,
                opacity: 1, 
                fillOpacity: 0.8
                };
    var attValue = Number(feature.properties[attribute]);
    
    geojsonMarkerOptions.fillColor = getColor(attValue);
    
    var layer = L.circleMarker(latlng,geojsonMarkerOptions);
    
    var year = attribute.split("_")[1];
    
    var popupContent ="<p><b>Stadium:</b> "+ feature.properties.Stadium + "</p>";
    popupContent += "<p><b>Team:</b> "+feature.properties.Team + "</p>";
    var panelContent = "<p><b>Population in " + year + ":</b> "+feature.properties[attribute] + "</p>";
    layer.bindPopup(popupContent);
    
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
    
    return layer;
};

function createColorSymbols(data, map,attributes){
    var markers = new L.MarkerClusterGroup();
     var geoJson = L.geoJson(data, {
                pointToLayer: function(feature, latlng){
					return pointToLayer(feature,latlng,attributes);
				}
            });
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
