// create an app object (to make use of namespacing)
const songApp = {};

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
    }).then(res => {
        songApp.token = res.access_token;
        songApp.getToplistsPlaylistId();
    })
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

// method to get toplists playlist id
songApp.getToplistsPlaylistId = () => {
    $.ajax({
        // url: `${songApp.spotifyUrl}/browse/categories/`,
        url: `${songApp.spotifyUrl}/browse/categories/toplists/playlists`,
        dataType: 'json',
        data: {
            country: 'US'
        },
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(res => songApp.getPlaylist(res.playlists.items[0].id))
}

// method to get toplists playlist info by id
songApp.getPlaylist = (id) => {
    $.ajax({
        url: `${songApp.spotifyUrl}/playlists/${id}`,
        dataType: 'json',
        headers: {
            'Authorization': `Bearer ${songApp.token}`
        },
    }).then(res => songApp.featArtists(res.tracks.items))
}

// method to put the top 8 artists from toplists playlist on DOM
songApp.featArtists = (artistInfo) => {
    console.log(artistInfo)
    for (let i = 0; i < 8; i++) {
        $('.features').append(`
            <div class="featArtist">
                <img src="${artistInfo[i].track.album.images[0].url}" alt="Image of ${artistInfo[i].track.artists[0].name}">
                <p>${artistInfo[i].track.artists[0].name}</p>
                <button>Select</button>
            </div>
        `)
        
        
        // console.log(artistInfo[i].track.album.images[0].url)
        // console.log(artistInfo[i].track.artists[0].name)
    }

    $('.featArtist').on('click', function (e) {
        console.log(e)
        console.log(this.children[1].textContent)
        const artistName = this.children[1].textContent
        console.log(artistName)
        if (e.target.tagName === 'BUTTON' && songApp.newGame) {
            console.log(artistName)
            console.log($('.startGame')[0].scrollHeight)
            $('.startGame').scrollTop($('.startGame')[0].scrollHeight);
            songApp.getArtistId(artistName, false)

        }
    })
    // $('.start').on('click', function (e) {
    //     console.log(e)
    //     console.log(this.children[1].textContent)
    //     const artistName = this.children[1].textContent
    //     console.log(artistName)
    //     if (e.target.tagName === 'BUTTON' && songApp.newGame) {
    //         songApp.newGame = false; // this stops the user from starting over 
    //         songApp.score = 0;
    //         songApp.startGameCountdown();
    //         songApp.getArtistId(artistName, false)
    //     }
    // })
}



// method to get artist id
songApp.getArtistId = (query, fromSearchBar = true) => {
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
        songApp.startGameHeader(data.artists.items[0])
        console.log(data.artists.items[0].name)
        console.log(data.artists.items[0].images[0])
        if(fromSearchBar){
            songApp.goButton(data.artists.items)
        }
    })
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
    }).then(res => songApp.tracks = res.tracks)
}

// method to grab some gif
songApp.getGifhy = () => {
    $.ajax({
        url: 'https://api.giphy.com/v1/gifs/search',
        dataType: 'json',
        data: {
            api_key: 'aAGxauRPGaLfiYsdB0fA2OWSQs57k1c9',
            q: 'thinking hard',
            rating: 'g',
            limit: 50,
            lang: 'en'
        }
    }).then( res => songApp.gifs = res.data)
}

// method to put selected artist details on DOM
songApp.startGameHeader = (artist) => {
    $('.startGame').empty();
    console.log(artist.name)
    console.log(artist.images[0])
    const element = `
        <h2 class="artistTitle">${artist.name} - Top Tracks</h2>
        <div class="imgContainer">
            <img src="${artist.images[0].url}" alt="Image of ${artist.name}"></img>
            <button>Start</button>
        </div>
    `
    $('.startGame').append(element);
}

// method which puts the artist picture on the DOM
songApp.goButton = (artists) => {

    // $('.artistTitle')[0].innerText = `${artists[0].name} - Top Tracks`

    $('.features').empty();

        // return the top 4 results
        for (let i = 0; i < 4; i++) {
        // artists.forEach(artist => {
            $('.features').append(`
                <div class="featArtist">
                    <img src="${artists[i].images[0].url}" alt="Image of ${artists[i].name}">
                    <p>${artists[i].name}</p>
                    <button>Select</button>
                </div>
            `)
        }

        $('.featArtist').on('click', function (e) {
            console.log(e)
            console.log(this.children[1].textContent)
            const artistName = this.children[1].textContent
            console.log(artistName)
            if (e.target.tagName === 'BUTTON' && songApp.newGame) {
                console.log(artistName)
                songApp.getArtistId(artistName, false)

            }
        })

}

// method which puts track on the DOM
songApp.displayTracks = () => {
    // clear the div of previous songs
    $('.topSongs').empty()

    // create a set of unique random numbers
    const nums = new Set();
    while (nums.size !== 5) {
        nums.add(Math.floor(Math.random() * 5) + 1);
    }
    
    randomIndexArray = [...nums]

    for (let i = 0; i < 5; i++) {
        const randomGifIndex = Math.floor(Math.random() * 50)
        const divElement =`
            <div class='song'>
                <h2>Song ${i+1} of 5 playing</h2>
                <div class="gifContainer">
                    <img src="${songApp.gifs[randomGifIndex].images.original.url}" alt="${songApp.gifs[randomGifIndex].title}" />
                </div>
                <form action="">
                    <label for="${songApp.tracks[randomIndexArray[i]].name}" class="sr-only">${songApp.tracks[randomIndexArray[i]].name}</label>
                    <input type="text" class='userGuess' id='${songApp.tracks[randomIndexArray[i]].name}' placeholder='Your Guess' disabled>
                </form>
                <audio src="${songApp.tracks[randomIndexArray[i]].preview_url}"></audio>
                <div class="timer">
                    <p>30</p>
                </div>
            </div>
        `
            $('.topSongs').append(divElement);
        }

    // lower audio volume
    $('audio').each(function() {$(this)[0].volume = 0.2})

    // add eventListener to each div element
    //play the song when the text input is focused
    $('.userGuess').one('focus', (e) => {
        e.currentTarget.parentElement.nextElementSibling.play()
        const timerDiv = e.currentTarget.parentElement.nextElementSibling.nextElementSibling
        const formEl = e.currentTarget.parentElement

        songApp.songCountdown(formEl, timerDiv);
    })

    // $('.userGuess').on('focusout', (e) => e.currentTarget.parentElement.previousElementSibling.pause())
    
    // eventListener for when user guess is submitted
    $('form').on('submit', (e) => {
        e.preventDefault();
        const formEl = e.currentTarget
        if (songApp.guessCheck(formEl, false)) {
            clearInterval(songApp.SongCountdownSetInterval)
            songApp.nextSong(formEl);
        } else {
            formEl[0].value = ''
        }
    })
}
//start
// events
songApp.eventListenerSetups = () => {
    // get user query for artist
    $('form').on('submit', (e) => {
        e.preventDefault();
        console.log('form')
        songApp.getArtistId($('#artistName').val());
    })

    // start the game
    $('.startGame').on('click', function(e) {
        console.log(e)
        console.log(this)
        if (e.target.tagName === 'BUTTON' && songApp.newGame) {
            songApp.newGame = false; // this stops the user from starting over 
            songApp.score = 0;
            songApp.startGameCountdown();
        }
    })

    // try again
    $('#tryAgain').on('click', () => {
        $('.results')[0].style.display = 'none'; // hide the results section
        $('.featureSection').scrollTop(0);
        songApp.startGameCountdown();
    })
    
    // new artist
    $('#newArtist').on('click', () => {
        $('#artistName').val('').focus();
    })
}

// start the game
songApp.startGame = () => {
    songApp.displayTracks();

    // enable text input and focus
    if ($('.userGuess')[0]) {
        $('.userGuess')[0].disabled = false;
        $('.userGuess')[0].focus();
        $('.userGuess')[0].scrollIntoView({
            block: 'center',
            inline: 'center'
        });
    }
}

// 3 secs to get ready before game starts
songApp.startGameCountdown = () => {
    let count = 3;

    const countdown = setInterval(() => {
        $('.countdown').remove();
        const divEl = `
            <div class="countdown">
                <p>${count}</p>
            </div>
        `
        
        $('.startGame .imgContainer').append(divEl);
        
        count--;
        
        if (count < 0) {
            clearInterval(countdown);
            $('.countdown').remove();
            songApp.startGame();
        }
        
    }, 1000)
    
}

// 30 sec countdown
songApp.songCountdown = (form, div) => {
    let i = 29;
    songApp.SongCountdownSetInterval = setInterval( () => {
        console.log('countdown')
        div.innerHTML = `<p>${i}</p>`
        i--
        if (i < 0) {
            clearInterval(songApp.SongCountdownSetInterval)
            songApp.guessCheck(form, true);
            songApp.nextSong(form);
        }
    }, 1000)
}

// play next song
songApp.nextSong = function(currentTarget) {
    console.log('nextSong')
    console.log(currentTarget) 
    console.log(currentTarget.parentElement.nextElementSibling) 
    console.log(currentTarget.parentElement.nextSibling.className) 

    // if there is no next element or if the next element isnt a song div
    if (!currentTarget.parentElement.nextElementSibling || currentTarget.parentElement.nextElementSibling.className !== 'song') {
        currentTarget.children[1].disabled = true;
        currentTarget.nextElementSibling.pause();
        console.log('end of game')
        songApp.tallyScore();
    } else {
        // form.input
        currentTarget.children[1].disabled = true; // disable text input
        //form.audio
        currentTarget.nextElementSibling.pause(); // pause audio
        // enable and focus next text input
        // form.song.song.form.input
        currentTarget.parentElement.nextElementSibling.children[2].children[1].disabled = false;
        currentTarget.parentElement.nextElementSibling.children[2].children[1].focus();
        // orginally these 2 lines 👆 were below the scrollIntoView. which caused smooth scrolling issues
        // scroll to next song div
        currentTarget.parentElement.nextElementSibling.scrollIntoView({
            block: 'center',
            inline: 'center'
        });
    }
}

songApp.guessCheck = function(element, timeup) {
    console.log('guesschekc', element)
    let songTitle;
    // some song titles includes (feat..., we got to take everything before ' (feat.'
    if (element[0].id.match('feat')) {
        songTitle = /.+?(?= \(feat.)/.exec(element[0].id)[0].toLowerCase();
    } else {
        songTitle = element[0].id.toLowerCase();
    }

    const userAnswers = element[0].value.toLowerCase()

    if (userAnswers === songTitle || timeup) {
        songApp.songTitles.push(songTitle)
        songApp.userAnswers.push(userAnswers)
        // only add score if they didnt run out of time
        if(!timeup) {
            songApp.score++
        }
        return true
    } else {
        return false
    }
}

// tally up the score
songApp.tallyScore = () => {

    songApp.newGame = true; // allows the user to click start again at the top of the page

    $('.results ol').empty()
    // $('.song .userGuess').each(function() {
    //     let songTitle;
    //     // some song titles includes (feat.), we got to take everything before ' (feat.'
    //     if ($(this)[0].id.match('feat')) {
    //         songTitle = /.+?(?= \(feat.)/.exec($(this)[0].id)[0];
    //     } else {
    //         songTitle = $(this)[0].id;
    //     }
    //     console.log(songTitle)
    //     console.log($(this)[0].value.toLowerCase(), songTitle.toLowerCase())

    //     $('.results .songTitles').append(`<li><p>${songTitle}</p></li>`);
    //     $('.results .userAnswers').append(`<li><p>${$(this)[0].value}</p></li>`);
        
    // })

    songApp.songTitles.forEach( title => $('.results .songTitles').append(`<li><p>${title}</p></li>`))

    songApp.userAnswers.forEach(answer => $('.results .userAnswers').append(`<li><p>${answer}</p></li>`))

    console.log($('.results h2'))
    $('.results h2')[0].innerText = `${songApp.score} out of 5 correct`;
    const scorePhrase = [
        'Nice Try',
        'You got one!',
        'Not bad at all!',
        'Well Done, Amazing!',
        'Well Done, Amazing!',
        'Unbelievable! Perfect Score!'
    ]
    $('.results h2')[1].innerText = `${scorePhrase[songApp.score]}`;
    $('.results')[0].style.display = 'flex';
    $('.results')[0].scrollIntoView({
        block: 'center',
        inline: 'center'
    });
}


songApp.init = () => {
    // save information within properties on the app object
    songApp.spotifyUrl = 'https://api.spotify.com/v1';
    songApp.tokenUrl = 'https://accounts.spotify.com/api/token';
    songApp.clientId = 'b6484d277d954668b083a54f44f00323';
    songApp.clientSecret = '3c2a90eda1a0484e8ec1a63a28f98736';
    songApp.getToken();
    songApp.eventListenerSetups();
    songApp.newGame = true;
    songApp.songTitles = [];
    songApp.userAnswers = [];
    songApp.getGifhy()
}

//document ready
$(() => {
    console.log('doc is ready')
    songApp.init();
})