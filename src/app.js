var map;//Global map variable
var markers = [];//Original markers array set empty. This will become populated in a for loop from the locations variable

var Location = function(data) {//Constructor for the titles
  this.title = data.title //See above
};

var ViewModel = {

 // markerArray : ko.observableArray(locations),//Starts with the full list of locations
  markerArray : ko.observableArray(),//Starts with the full list of locations

  query : ko.observable(''),//Empty observable array

  search : function(value) {//Create a function that passes in a string value that will act as a search string for a location
    ViewModel.markerArray.removeAll();//Removes all locations from the locations observableArray
    for (var x in locations) {//For every individual location in the markers array...
      if (locations[x].title.toLowerCase().indexOf(value.toLowerCase()) >= 0) {//If the title of the location(set to lowercase) is = to the text value typed...
        ViewModel.markerArray.push(locations[x]);//Push the new location onto the visible list
      }
    }
  },
  makeLocations: function(locations) {//Creating the array of location titles
    var self = this;
    locations.forEach(function(location) {
      self.markerArray.push(new Location(location))
    })
  },
  goToLocation : function(place,data) {
    place.marker.popInfoWindow();//Calls the marker property 'popInfoWindow' which callbacks the populateInfoWindow function
  }
};

ViewModel.makeLocations(locations);//Attaches the title array to the ViewModel

function initMap() {

    var styles = [
      {
        featureType: 'water',
        stylers: [
          {color: '#000000'}
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
          {color: '#ffffff'},
          {weight: 6}
        ]
      }];
    //Below stores the map
    map = new google.maps.Map(document.getElementById('map'),{
      //Below sets the initial location of the map on the screen
      center: new google.maps.LatLng(40.6251388,-74.0282899),
      //Below sets the level of zoom (1 = farthest away possible)
      zoom: 14,
      //Below styles the map based on the style features declared above
      styles: styles,
    });

    //Creating a marker for each location, setting it to the map, giving it a
    //title, the corresponding website and some animation.
    var largeInfoWindow = new google.maps.InfoWindow();

    var createMarkers = (function() {//Creates a marker for every location below with attached properties
      for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        marker = new google.maps.Marker({
          position : position,
          map : map,
          title : title,
          website : locations[i].website,
          imgs : locations[i].imgs,
          animation : google.maps.Animation.DROP,
          icon : 'forkknife.png',
          id : i
        });

        locations[i].marker = marker;//Adds a marker property to the location data
        ViewModel.markerArray()[i].marker = marker;

        marker.popInfoWindow = function() {//Adds a property to the marker to create the info window with street view
          populateInfoWindow(this,largeInfoWindow);
        }

        marker.addListener('click',function(){//Adds click element to the actual markers on the map which opens the info window with google street view
          populateInfoWindow(this,largeInfoWindow);
          this.setAnimation(google.maps.Animation.DROP);
        });
        markers.push(marker);//Adds the current marker to the array of markers
      }
    })()

    var populateInfoWindow = function (marker,infowindow) {
      //If the window isn't connected to a marker, set the window to nothing
      if(infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
        });
        //Storing a streetViewService as well as a close radius of 50
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        //If the status of the streetView is good to go, create a nearby location
        //then create DOM node that has a head, storing the marker title, marker pano
        //and the marker website
        function getStreetView(data, status) {
          if (status == google.maps.StreetViewStatus.OK) {//If the status of the StreetView is good to go...
            console.log('Name: '+marker.title+'. GPS: '+marker.position);//Log the coordinates and title
            var nearStreetViewLocation = data.location.latLng;//Create a variable to store the nearest location to the current marker selected
            var heading = google.maps.geometry.spherical.computeHeading(//Organize the content for the popup box
              nearStreetViewLocation, marker.position);
              infowindow.setContent('<div style="text-align:center;"><h2>' +//Create the content for the popup box
              marker.title + '</h2><div id="pano"></div><br>' +//^
               '<a href="'+ marker.website +'">Click here for the menu</a></div>');//^
              var panoramaOptions = {//Create the panorama defaults
                position: nearStreetViewLocation,
                pov: {
                  heading: heading,
                  pitch: 30
                }
              };
            var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);//Initiate the panorama
          } else {
            infowindow.setContent('<div>' + marker.title + '</div>' +//If the marker isn't found, Create an alert box telling the user there is no street view found
              '<div>No Street View Found</div>');
          }
        }
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);// Open the infowindow on the correct marker.
        infowindow.open(map, marker);// Open the infowindow on the correct marker.

        map.panTo(marker.position);//Go to the location of the marker
        map.setZoom(16);//Zoom to 16 on the map
        marker.setAnimation(google.maps.Animation.DROP);//Animates the marker
      }
    }
  }

ViewModel.query.subscribe(ViewModel.search);//Subscribes the changes made in the search query box
ko.applyBindings(ViewModel);//Links the ViewModel to the View
