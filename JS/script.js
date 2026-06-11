console.log('Writing JS!');
let currentSong = new Audio();
let songs = [];
let currFolder;

function formatTime(seconds) {
    seconds = Math.floor(seconds);

    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;

    // pad with 0
    mins = mins.toString().padStart(2, '0');
    secs = secs.toString().padStart(2, '0');

    if (hrs > 0) {
        return `${hrs}:${mins}:${secs}`;
    } else {
        return `${mins}:${secs}`;
    }
}

async function getSongs(folder) {

    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    // console.log(response);
    let div = document.createElement("div");
    div.innerHTML = response;
    console.log(response);

    let as = div.getElementsByTagName("a");
    songs = [];



    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        let href = element.getAttribute("href");

        // fix backslashes + encoding
        href = decodeURIComponent(href).replaceAll("\\", "/");

        if (href.endsWith(".mpeg")) {
            songs.push(href.split(`/${folder}/`)[1]);
        }
        
    }
    // Get list of all songs from the server
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li>
            <img class="invert" src="Images/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert" src="Images/play.svg" alt="Play Now">
            </div>
        </li>`;
    }

    // Attach event listeners to each songs in the playlist
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track ;
    if (!pause) {
        currentSong.play();
        play.src = "Images/pause.svg";
    }

    document.querySelector(".songInfo").innerHTML = track || "";
    document.querySelector(".songTime").innerHTML = "0:00 / 0:00";

}
async function displayAlbums() {
    let a = await fetch("/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    cardContainer.innerHTML = "";

    for (const e of anchors) {
        let href = decodeURIComponent(e.getAttribute("href"))
            .replaceAll("\\", "/");

        if (!href.includes("/songs/")) continue;

        let folder = href.split("/").slice(-2)[0];

        let res = await fetch(
            `/songs/${folder}/info.json`
        );

        let info = await res.json();

        cardContainer.insertAdjacentHTML(
            "beforeend",
            `
            <div data-folder="${folder}" class="card rounded">
                <div class="play">
                    <div class="playCircle">
                        <svg viewBox="0 0 24 24" width="18">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    </div>
                </div>

                <img src="/songs/${folder}/cover.jpeg">

                <div class="cardInfo">
                    <div class="song">${info.title}</div>
                    <div class="artist">${info.description}</div>
                </div>
            </div>
            `
        );
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            document.querySelector(".emptyLibrary").style.display = "none";
            await getSongs(`songs/${card.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}


async function main() {

    // Get all songs in the playlist
    await getSongs("songs/Best of Billie Eillish");
    playMusic(songs[0], true);

    // Display all the albums on the page

    displayAlbums();



    // Attach event listeners to play, next and previous buttons
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "Images/pause.svg";
            play.class = "invert";
        } else {
            currentSong.pause();
            play.src = "Images/Play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        if (isNaN(currentSong.duration)) return;
        document.querySelector(".songTime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration * 100) + "%";
    });

    // Add an event listener for seekbar

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;

        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    let menuBtn = document.getElementById("menuBtn");
    let sidebar = document.querySelector(".left");

    let isOpen = false;

    menuBtn.addEventListener("click", () => {
        if (!isOpen) {
            sidebar.style.left = "-2%";
            menuBtn.querySelector("img").src = "Images/close.svg";
            isOpen = true;
        }
        else {
            sidebar.style.left = "-100%";
            menuBtn.querySelector("img").src = "Images/hamburger.svg";
            isOpen = false;
        }
    });
    document.querySelector(".close").addEventListener("click", () => {
        sidebar.style.left = "-100%";
        menuBtn.querySelector("img").src = "Images/hamburger.svg";
        isOpen = false;
    });
    let previous = document.getElementById("previous");
    let next = document.getElementById("next");

    previous.addEventListener("click", () => {
        console.log('prev clicked!');
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let idx = songs.indexOf(current);
        if (idx - 1 >= 0) {
            playMusic(songs[idx - 1]);
        }

    })
    next.addEventListener("click", () => {
        console.log('next clicked!');
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let idx = songs.indexOf(current);
        if (idx + 1 < songs.length) {
            playMusic(songs[idx + 1]);
        }
    })
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            sidebar.style.left = "0";   // reset
            isOpen = false;
        }
        else {
            sidebar.style.left = "-120%";
            isOpen = false;
        }
    });

    // Add an event to volume
    let previousVolume = 0.1;
    let slider = document.querySelector(".range input");

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        let volume = parseInt(e.target.value) / 100;

        currentSong.volume = volume;
        let volIcon = document.querySelector(".volControl > img");


        if (volume === 0) {
            volIcon.src = "Images/mute.svg";
        } else {
            volIcon.src = "Images/vol.svg";
            previousVolume = volume;
        }
    })

    // Add event to mute song
    document.querySelector(".volControl>img").addEventListener("click", (e) => {
        // console.log(e.target);

        if (e.target.src.includes("Images/vol.svg")) {
            e.target.src = "Images/mute.svg";
            currentSong.volume = 0;
            slider.value = 0;
        }
        else {
            e.target.src = "Images/vol.svg";
            currentSong.volume = previousVolume;
            slider.value = previousVolume * 100;  // restore slider
        }


    })


};

main()