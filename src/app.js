var map;//Global map variable
var markers = [];//Original markers array set empty. This will become populated in a for loop from the locations variable
window.onerror = function(msg,url,line) {//If the DOM does not load properly...
  alert('Hmm.. There seems to be a problem loading this page.\n\n' +
  'Message: ' + msg + '\nURL : ' + url + '\nLine : ' + line);
  return true;
};

mapError = function() {//If the map does not load properly...
  alert('There seems to be a map error');
};

var Location = function(data) {//Constructor for the titles (data = locations)
  this.title = data.title; //See above
};

var ViewModel = {

  markerArray : ko.observableArray(),//Starts with the empty list of locations then
  //is populated by the Locations contructor function

  query : ko.observable(''),//Empty search array

  reviewList : ko.observableArray(),//Empty review array with default welcome message

  search : function(value) {//Create a function that passes in a string value that will act as a search string for a location
    for (var i = 0; i<markers.length; i++) {//Removes the markers from the map
      markers[i].setVisible(false);
    }
    ViewModel.reviewList.removeAll();//Removes the Zomato reviews
    ViewModel.markerArray.removeAll();//Removes all locations from the locations observableArray
    for (var x in locations) {//For every individual location in the markers array...
      if (locations[x].title.toLowerCase().indexOf(value.toLowerCase()) >= 0) {//If the title of the location(set to lowercase) is = to the text value typed...
        ViewModel.markerArray.push(locations[x]);//Push the new location onto the visible list
        markers[x].setVisible(true);//Toggle the marker visibility
      }
    }
  },

  showAllmarkers : function() {//Shows all the markers on the map
    for (var x = 0; x < markers.length; x++) {
      markers[x].setVisible(true);
      markers[x].setAnimation(google.maps.Animation.DROP);
    }
  },

  makeLocations: function(locations) {//Creating the array of location titles
    var self = this;
    locations.forEach(function(location) {
      self.markerArray.push(new Location(location));
    });
  },

  //-----------------------------------------------------------
  //When the user clicks the location from the side menu,
  //this is the first function that is executed
  goToLocation : function(place,data) {
    for (var x = 0; x < markers.length; x++) {
      markers[x].setVisible(false);//Clears all visible markers off the map
    }
    place.marker.setVisible(true);//Makes the current marker selected visible
    place.marker.popInfoWindow();
  }
  //-----------------------------------------------------------
};

ViewModel.makeLocations(locations);//Attaches the title array to the ViewModel


function initMap() {

    var styles = [
      {
        featureType: 'water',
        stylers: [
          {color: '#FFFFFF'}
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

    createWindow = function() {
      populateInfoWindow(this,largeInfoWindow);
    };

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
          resID : locations[i].resID,
          animation : google.maps.Animation.DROP,
          icon : 'forkknife.png',
          id : i,
        });

        //Added marker functionality attachments below
        locations[i].marker = marker;//Adds a marker property to the location data
        ViewModel.markerArray()[i].marker = marker;//Adds the marker titles for the search query
        marker.zomato = ViewModel.zomatoReviews;
        marker.popInfoWindow = createWindow;//Adds a property to create a window for the currently selected marker
        marker.addListener('click',createWindow);//Attaches the click element to each marker
        markers.push(marker);//Adds the current marker to the array of markers
      }
    })();

    var populateInfoWindow = function (marker,infowindow) {
      reviews = [];
      zomatoReviews = function(data) {//Ajax request to Zomato.com for restaurant reviews
        $.ajax({
          dataType: 'json',
          url: 'https://developers.zomato.com/api/v2.1/reviews?res_id='+marker.resID,
          headers: {
            'user-key': '19b6f28a79ec4858856da336e1fee593'
          },
          success: function(response, status, xhr) {
            clearReviews = function() {//Removes the current zomato reviews when the current marker is clicked
              reviews.splice(0,reviews.length);
            };
            ViewModel.reviewList.removeAll();//Removes all current items in the review Array
            for (var i = 0; i < response.user_reviews.length; i++) {//Pushes each review into an observable array
              ViewModel.reviewList.push('"'+response.user_reviews[i].review.review_text +'"');
              reviews.push('"'+response.user_reviews[i].review.review_text +'"');//See above
            }

            if(infowindow.marker != marker) {//If the window isn't connected to a marker...
              infowindow.setContent('');//set the window to nothing
              infowindow.marker = marker;
              infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
              });
              var streetViewService = new google.maps.StreetViewService();//Storing a streetViewService instance
              var radius = 50;//Radius of the streetview will be initially set to 50

              //If the status of the streetView is good to go, create a nearby location
              //then create DOM node that has a head, storing the marker title, marker pano
              //and the marker website
              var getStreetView = function (data, status) {

                if (status == google.maps.StreetViewStatus.OK) {//If the status of the StreetView is good to go...
                  console.log('Name: '+marker.title+'. GPS: '+marker.position);//Log the coordinates and title
                  var nearStreetViewLocation = data.location.latLng;//Create a variable to store the nearest location to the current marker selected
                  var heading = google.maps.geometry.spherical.computeHeading(//Organize the content for the popup box
                    nearStreetViewLocation, marker.position);
                    infowindow.setContent(
                      '<div style="text-align:center;">'+

                        '<h2>'+
                          '<a style="text-decoration:none;color:black;" href="'+marker.website+'">'+marker.title+'</a>' +
                        '</h2>'+

                        '<div style="border: solid red 1px;">'+
                          '<div id="pano"</div>'+

                      '</div>'+

                      '<div id="listView" style="float:right;"><h3>Zomato Reviews</h3>'+reviews+'</div>');
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
              };
              streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);// Open the infowindow on the correct marker.
              infowindow.open(map, marker);// Open the infowindow on the correct marker.

              map.panTo(marker.position);//Go to the location of the marker
              map.setZoom(15);//Zoom to 16 on the map
              marker.setAnimation(google.maps.Animation.DROP);//Animates the marker
            }

          },
          error: function(xhr, ajaxOptions, thrownError) {
            alert('Hmm.. There seems to a problem with our Zomato API. Check back ' +
             'in with us later. We are working on to fix it.');
          }
        });
      };
      zomatoReviews();//Invoking the reviews
    };
  }

ViewModel.query.subscribe(ViewModel.search);//Subscribes the changes made in the search query box
ko.applyBindings(ViewModel);//Links the ViewModel to the View
