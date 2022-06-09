// create an app object (to make use of namespacing)
const songApp = {};

// save information within properties on the app object
songApp.spotifyUrl = 'https://api.spotify.com/v1';
songApp.tokenUrl = 'https://accounts.spotify.com/api/token';
songApp.clientId = 'b6484d277d954668b083a54f44f00323';
songApp.clientSecret = '3c2a90eda1a0484e8ec1a63a28f98736';

songApp.getToken = () => {
    $.ajax({
        url: songApp.tokenUrl,
        method: 'POST',
        dataType: 'json',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(songApp.clientId + ':' + songApp.clientSecret)
        },
        data: {
            grant_type: 'client_credentials'
        },
    }).then(data => {
        songApp.token = data.access_token})
    .catch(err => {
        if (err.apiData) {
            // Request made and server responded
            console.log(err.apiData.data);
            console.log(err.apiData.status);
            console.log(err.apiData.headers);
        } else if (err.request) {
            // The request was made but no response was received
            console.log(err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", err.message);
            console.log("Error", err);
        }
    })
}

// method to get artist id
songApp.getArtistId = (query) => {
    $.ajax({
        url: songApp.spotifyUrl + '/search',
        dataType: 'json',
        data: {
            q: query,
            type: 'artist'
        },
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(data => songApp.getTopTracks(data.artists.items[0].id)) // we need to create another method to check if the first item return match's user's query term, if not show a list. But for now assume it matches
}

// method to get artist's top tracks
songApp.getTopTracks = (id) => {
    const endpoint = `/artists/${id}/top-tracks`
    $.ajax({
        url: songApp.spotifyUrl + endpoint,
        dataType: 'json',
        data: {
            market: 'US'
        },
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(data => songApp.displayTracks(data.tracks))
}



//document ready
$(() => {
    console.log('doc is ready')
    songApp.getToken();

})