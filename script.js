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
            <div class="start">
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
                <div class="timer">
                    <p>30</p>
                </div>
            </div>`
            
            $('.topSongs').append(divElement);
        })

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
    $('form').on('submit', function(e)  {
        e.preventDefault();
        const formEl = e.currentTarget
        if (songApp.guessCheck(this)) {
            clearInterval(songApp.SongCountdownSetInterval)
            songApp.nextSong(formEl);
        } else {
            this[0].value = ''
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

    // run startGame method
    $('.search').on('click', (e) => {
        if (e.target.tagName === 'BUTTON' && songApp.newGame) {
            songApp.newGame = false; // this stops the user from starting over 
            songApp.score = 0;
            songApp.startGameCountdown();
        }
    })

    // try again
    $('#tryAgain').on('click', () => {
        $(window).scrollTop(0);
        songApp.startGameCountdown();
    })
    
    // new artist
    $('#newArtist').on('click', () => {
        $('#artistName').val('').focus();
        $(window).scrollTop(0);
    })
}

// start the game
songApp.startGame = () => {
    songApp.displayTracks(songApp.tracks);

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
        
        $('.start').append(divEl);
        
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
                songApp.nextSong(form)
            }
    }, 1000)
}

// play next song
songApp.nextSong = function(currentTarget) {
    console.log('nextSong')
    console.log(currentTarget) 

    // if there is no next element or if the next element isnt a song div
    if (!currentTarget.parentElement.nextSibling || currentTarget.parentElement.nextSibling.className !== 'song') {
        currentTarget.children[1].disabled = true;
        currentTarget.nextElementSibling.pause();
        console.log('end of game')
        songApp.tallyScore();
    } else {

        currentTarget.children[1].disabled = true; // disable text input
        currentTarget.nextElementSibling.pause(); // pause audio
        // enable and focus next text input
        currentTarget.parentElement.nextSibling.children[1].children[1].disabled = false;
        currentTarget.parentElement.nextSibling.children[1].children[1].focus();
        // orginally these 2 lines 👆 were below the scrollIntoView. which caused smooth scrolling issues
        // scroll to next song div
        currentTarget.parentElement.nextSibling.scrollIntoView({
            block: 'center',
            inline: 'center'
        });
    }
}

songApp.guessCheck = function(element) {
    console.log('guesschekc', element)
    let songTitle;
    // some song titles includes (feat.), we got to take everything before ' (feat.'
    if (element[0].id.match('feat')) {
        songTitle = /.+?(?= \(feat.)/.exec(element[0].id)[0].toLowerCase();
    } else {
        songTitle = element[0].id.toLowerCase();
    }

    const userAnswers = element[0].value.toLowerCase()
    if (userAnswers === songTitle) {
        songApp.score++
        songApp.songTitles.push(songTitle)
        songApp.userAnswers.push(userAnswers)
        return true
    } else {
        return false
    }
}

// tally up the score
songApp.tallyScore = () => {

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
}

//document ready
$(() => {
    console.log('doc is ready')
    songApp.init();
})