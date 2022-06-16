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
        url: `${songApp.spotifyUrl}/search`,
        dataType: 'json',
        data: {
            q: query,
            type: 'artist'
        },
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(data => {
        songApp.getTopTracks(data.artists.items[0].id)
        console.log(data.artists.items[0].images[0].url)
        $('.startGame h2')[0].innerText = `${data.artists.items[0].name} - Top 10 Tracks`

        $('.search div').remove();
        $('.search').append(`
            <div>
                <img src="${data.artists.items[0].images[0].url}" alt="Image of ${data.artists.items[0].name}">
                <button>Start</button>
            </div>
        `)
    }) // we need to create another method to check if the first item return match's user's query term, if not show a list. But for now assume it matches
}

// method to get artist's top tracks
songApp.getTopTracks = (id) => {
    $.ajax({
        url: `${songApp.spotifyUrl}/artists/${id}/top-tracks`,
        dataType: 'json',
        data: {
            market: 'US'
        },
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(data => songApp.tracks = data.tracks)
}

// method which puts track on the DOM
songApp.displayTracks = (tracks) => {
    // clear the div of previous songs
    $('.topSongs').empty()

    tracks.forEach((track, index) => {
        const divElement =
            `<div class='song'>
            <h2>Song ${index+1} of 10 playing</h2>
            <form action="">
                <label for="${track.name}">${track.name}</label>
                <input type="text" class='userGuess' id='${track.name}' placeholder='Your Guess' disabled>
                </form>
                <audio src="${track.preview_url}"></audio>
            </div>`
            
            $('.topSongs').append(divElement);
        })

    // lower audio volume
    $('audio').each(function() {$(this)[0].volume = 0.2})

    // add eventListener to each div element
    //play the song when the text input is focused
    $('.userGuess').on('focus', (e) => e.currentTarget.parentElement.nextElementSibling.play())
    // $('.userGuess').on('focusout', (e) => e.currentTarget.parentElement.previousElementSibling.pause())
    
    // eventListener for when user guess is submitted
    $('form').on('submit', (e) => {
        e.preventDefault()
        
        // if there is no next element or if the next element isnt a song div
        if (!e.currentTarget.parentElement.nextSibling || e.currentTarget.parentElement.nextSibling.className !== 'song') {
            e.currentTarget.children[1].disabled = true;
            e.currentTarget.nextElementSibling.pause();
            console.log('end of game')
            songApp.tallyScore();
        } else {
            
            e.currentTarget.children[1].disabled = true; // disable text input
            e.currentTarget.nextElementSibling.pause(); // pause audio
            // scroll to next song div
            e.currentTarget.parentElement.nextSibling.scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center'
            });
            // enable and focus next text input
            e.currentTarget.parentElement.nextSibling.children[1].children[1].disabled = false;
            e.currentTarget.parentElement.nextSibling.children[1].children[1].focus();
        }
    })
}

// events
songApp.eventListenerSetups = () => {
    // get user query for artist
    $('form').on('submit', (e) => {
        e.preventDefault();
        songApp.getArtistId($('#artistName').val());
    })

    $('.search button').on('click', () => songApp.startGame())
    
    // start the game
    $('.search').on('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.parentElement.tagName === 'BUTTON' && songApp.newGame) {
            songApp.newGame = false; // this stops the user from starting over 
            $('.button').disabled = true;
            songApp.displayTracks(songApp.tracks);
            songApp.startGame();
        }
    })
}

songApp.startGame = () => {
    console.log('start game')
    // enable text input and focus
    if ($('.userGuess')[0]) {
        $('.userGuess')[0].disabled = false;
        $('.userGuess')[0].focus();
        $('.userGuess')[0].scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'center'
        });
    }
}

songApp.tallyScore = () => {
    songApp.score = 0;
    $('.song .userGuess').each(function() {
        let songTitle;
        // some song titles includes (feat.), we got to take everything before ' (feat.'
        if ($(this)[0].id.match('feat')) {
            songTitle = /.+?(?= \(feat.)/.exec($(this)[0].id)[0];
        } else {
            songTitle = $(this)[0].id;
        }
        console.log(songTitle)
        console.log($(this)[0].value.toLowerCase(), songTitle.toLowerCase())
        if ($(this)[0].value.toLowerCase() === songTitle.toLowerCase()) {
            songApp.score++
        }
        $('.results .songTitles').append(`<li><p>${songTitle}</p></li>`);
        $('.results .userAnswers').append(`<li><p>${$(this)[0].value}</p></li>`);
        
    })
    console.log($('.results h2'))
    $('.results h2')[0].innerText = `${songApp.score} out of 10 correct`;
    const scorePhrase = [
        'Nice Try',
        'Nice Try',
        'Nice Try',
        'Nice Try',
        'You Did it!',
        'Not bad at all!',
        'Not bad at all!',
        'Well Done, Amazing!',
        'Well Done, Amazing!',
        'Unbelievable! Perfect Score!'
    ]
    $('.results h2')[1].innerText = `${scorePhrase[songApp.score]}`;
    $('.results')[0].style.display = 'flex';
    $('.results')[0].scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
    });
}


songApp.init = () => {
    songApp.getToken();
    songApp.eventListenerSetups();
    songApp.newGame = true;
}

//document ready
$(() => {
    console.log('doc is ready')
    songApp.init();
})