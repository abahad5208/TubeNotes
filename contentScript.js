var playbackTime = 0;
var videoTitle;

function pause_video() {
    document.getElementsByClassName('video-stream')[0].pause();
};

function get_timestamp() {
    return new Promise((resolve, reject) => {
        playbackTime = document.getElementsByClassName('video-stream')[0].currentTime;
        resolve(playbackTime);
    });
};

function get_title() {
    return new Promise((resolve, reject) => {
        videoTitle = document.getElementsByClassName("ytp-title-link yt-uix-sessionlink")[0].innerText;
        resolve(videoTitle);
    })
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "pause_video") {
        pause_video();
    } else if(request.message === "get_title") {
        let titleReq = get_title();

        titleReq.then(function(res) {
            sendResponse({value: res})
        });
    } else if(request.message === "get_time") {
        let timeReq = get_timestamp();

        timeReq.then(function(res) {
            sendResponse({value: res})
        });
    } else {
        var sec = parseInt(request.message);
        console.log(sec);
        document.getElementsByTagName('video')[0].currentTime = sec;
    }
});