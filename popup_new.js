// Variables List
var validTab = document.getElementById('valid');
var videoTitle = document.getElementById('vidTitle');
var notesFound = document.getElementById('notesFound');
var notesDesc = document.getElementById('notesContent');
var notesTable = document.getElementById('notesTable_body');
var noNotes = document.getElementById('noNotes');
var addNotebtn = document.getElementById('add_note');
var content = document.getElementById('selection');
var refNotesbtn = document.getElementById('refresh_notes');
var saveAllNotes = document.getElementById('save_notes');

var invalidTab = document.getElementById('invalid');
var videosFound = document.getElementById('videosFound');
var videosList = document.getElementById('videosList_body');
var noVideos = document.getElementById('noVideos');
var refVideosbtn = document.getElementById('refresh_videos');

var formDiv = document.getElementById('formDiv');
var noteForm = document.getElementById('note_form');
var note_title = document.getElementById('note_title');
var note_content = document.getElementById('note_content');
var saveNoteBtn = document.getElementById('save_note');
var saveEditBtn = document.getElementById('save_edit');
var cancelNoteBtn = document.getElementById('cancel_note');

const isYTVid = /^https?:\/\/www.youtu\.?be(?:(?:-nocookie)?\.com\/(?:embed\/)|(?:\.com\/watch\?v=))([^#\&\?]+).*/;
var site, videoID, time; 
var edit = 0;
var edit_time, edit_title_old, edit_content_old, del_time, currentTime;

// Listening for response from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Get Notes
    if (request.message === 'getNotes_success') {
        notesTable.innerHTML = "";
        var get_res = request.payload;
        var res_len = get_res.length;
        // Notes Found
        if (res_len > 0) {
            get_res.sort(function (a, b) {
                return a.videoTime - b.videoTime;
            });

            for (let index = 0; index < res_len; index++) {
                notesTable.innerHTML += "<tr class='d-flex'><td class='col-2 vidTime' data-scroll='"+ get_res[index].videoTime + "'><a class='scrollTime'>" + convert(get_res[index].videoTime) + "</a></td><td class='col-6 noteTitle' data-content='"+ get_res[index].noteContent.replace(/'/g,'&#x27;') + "'>" + get_res[index].noteTitle.replace(/'/g,'&#x27;') + "</td><td class='col-2'><button class='btn btn-outline-warning editBtns' type='button'>Edit Note</button></td><td class='col-2'><button class='btn btn-outline-danger deleteBtns' type='button'>Delete Note</button></td></tr>"
            }

            saveAllNotes.style.display = "inline-block";

            // Scroll Video
            document.querySelectorAll(".scrollTime").forEach(function(el) {
                el.addEventListener('click', scrollThis)
            });

            // Highlight Note Title and Display Note Content 
            document.querySelectorAll(".noteTitle").forEach(function(el) {
                el.addEventListener('click', function() {
                    var cells = document.getElementsByTagName("td");
                    for(const cell of cells) {
                        cell.style.backgroundColor = "white";
                    };
                    this.style.backgroundColor = "#FDFF47";
                    content.innerHTML = this.getAttribute("data-content");
                    content.style.color = "black";
                });
            });

            noNotes.style.display = 'none';
            notesFound.style.display = 'block';
            notesDesc.style.display = 'block';

            // Edit Buttons
            document.querySelectorAll('.editBtns').forEach(function(el) {
                el.addEventListener('click', function() {
                    edit = 1;
                    edit_time = this.closest("tr").querySelector(".vidTime").getAttribute("data-scroll");
                    // edit_id = get_videoID();
                    edit_title_old = this.closest("tr").querySelector(".noteTitle").innerHTML;
                    edit_content_old = this.closest("tr").querySelector(".noteTitle").getAttribute("data-content");
                    formDisp();
                });
            });

            // Delete Buttons
            document.querySelectorAll('.deleteBtns').forEach(function(el) {
                el.addEventListener('click', function() {
                    del_time = this.closest("tr").querySelector(".vidTime").getAttribute("data-scroll");
                    deleteconfirm();
                });
            });

            // Save Notes Button
            saveAllNotes.addEventListener('click', function() {
                var anchor = document.createElement("a");
                anchor.style = "display: none";
                // return function () {
                var data = "";
                data += "Video ID: " + videoID + "\n";

                for (let i = 0; i < res_len; i++) {
                    data += "Note Time: " + convert(get_res[i].videoTime) + "\nNote Title: " + get_res[i].noteTitle.replace(/'/g,'&#x27;') + "\nNote Content: " + get_res[i].noteContent.replace(/'/g,'&#x27;') + "\n";
                }
                console.log(data);

                var blob = new Blob([data], {type: "text"});
                var url = window.URL.createObjectURL(blob);
                anchor.href = url;
                anchor.download = "save.txt";
                anchor.click();
                window.URL.revokeObjectURL(url);

                // };
            });

        // No Notes Found
        } else {
            notesFound.style.display = 'none';
            notesDesc.style.display = 'none';
            noNotes.style.display = 'block';
            saveAllNotes.style.display = "none";
        }
    // Get Videos
    } else if(request.message === 'getVideos_success') {
        videosList.innerHTML = ""
        saveAllNotes.style.display = "none";
        var get_vid = request.payload;
        var vid_len = Object.keys(request.payload).length;
        // Videos Found
        if (vid_len > 0) {
            for (var vidID in get_vid) {
                videosList.innerHTML += "<li><a href='https://www.youtube.com/watch?v=" + vidID + "' target='_blank'>" + get_vid[vidID] + "</a></li>"
            };
            noVideos.style.display = 'none';
            videosFound.style.display = 'block';
        // No Videos Found
        } else {
            videosFound.style.display = 'none';
            noVideos.style.display = 'block';
        }
    // Insert note
    } else if(request.message === 'insertNote_success') {
        if(request.payload) {
            refNotesbtn.click();

                invalidTab.style.display = 'none';
                formDiv.style.display = 'none';
                validTab.style.display = "block";
        }
    // Edit Note
    } else if(request.message === 'editNotes_success') {
        if(request.payload) {
            refNotesbtn.click();

                invalidTab.style.display = 'none';
                formDiv.style.display = 'none';
                validTab.style.display = "block";
        }
    // Delete Note
    } else if(request.message === 'deleteNote_success') {
        if(request.payload) {
            refNotesbtn.click();

                invalidTab.style.display = 'none';
                formDiv.style.display = 'none';
                validTab.style.display = "block";
        }
    }
});

// Check if page is valid YouTube video page
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    site = tabs[0].url;

    // Valid YouTube video page
    if (isYTVid.test(site)) {
        pause();
        get_title();
        get_time();
        refNotesbtn.click();

            invalidTab.style.display = 'none';
            formDiv.style.display = 'none';
            validTab.style.display = "block";
    // Invalid YouTube video page
    } else {
        refVideosbtn.click();

            validTab.style.display = "none";
            formDiv.style.display = 'none';
            invalidTab.style.display = 'block';
    };
});

function get_videoID() {
    return site.match(isYTVid)[1];
};

function convert(seconds) {
    return new Date(parseInt(seconds) * 1000).toISOString().substr(11, 8);
};

refNotesbtn.addEventListener('click', function() {

    videoID = get_videoID();

    content.innerHTML = "Select a note to see the content.";
    content.style.color = "darkgrey";

    chrome.runtime.sendMessage({
        message: 'get_notes',
        payload: videoID
    });
});

refVideosbtn.addEventListener('click', function() {

    chrome.runtime.sendMessage({
        message: 'get_videos'
    });
});

addNotebtn.addEventListener('click', function() {
    edit = 0;
    formDisp();
});

function scrollThis() {
    var scroll_time = this.closest("td").getAttribute("data-scroll");
    console.log(scroll_time);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: scroll_time}, null);
    });
};

function formDisp() {
    cancelNoteBtn.removeEventListener('click', cancelconfirm);
    if(edit == 0) {
        saveNoteBtn.style.display = 'inline-block';
        saveEditBtn.style.display = 'none';
        noteForm.reset();

        saveNoteBtn.removeEventListener('click', addconfirm);
        validTab.style.display = "none";
        invalidTab.style.display = 'none';
        formDiv.style.display = "block";

        saveNoteBtn.addEventListener('click', addconfirm);
    } else {
        saveNoteBtn.style.display = 'none';
        saveEditBtn.style.display = 'inline-block';
        note_title.value = edit_title_old;
        note_content.value = edit_content_old;

        saveEditBtn.removeEventListener('click', editconfirm);
        validTab.style.display = "none";
        invalidTab.style.display = 'none';
        formDiv.style.display = "block";

        saveEditBtn.addEventListener('click', editconfirm);
    };

    cancelNoteBtn.addEventListener('click', cancelconfirm);
};

function addconfirm() {
    var addcon = confirm('Are you sure you want to save this note?');
    if(addcon == true) {
        chrome.runtime.sendMessage({
            message: 'add_note',
            payload: [{
                "videoID": videoID,
                "videoTime": currentTime.toString(),
                "videoTitle": videoTitle.innerHTML,
                "noteTitle": note_title.value,
                "noteContent": note_content.value
            }]
        });
        console.log("Add request sent");
    };
};

function editconfirm() {
    var editcon = confirm('Are you sure you want to save these changes?');
    if(editcon == true) {
        chrome.runtime.sendMessage({
            message: 'edit_note',
            payload: {
                "videoID": videoID,
                "videoTime": edit_time.toString(),
                "noteTitle": note_title.value,
                "noteContent": note_content.value
            }
        });
        console.log("Edit request sent");
    };
};

function cancelconfirm() {
    var cancelcon = confirm('Are you sure you want to discard these changes?');
        if(cancelcon == true) {
            console.log("Cancelled");
            noteForm.reset();
            validTab.style.display = "block";
            invalidTab.style.display = 'none';
            formDiv.style.display = "none";
        };
};

function deleteconfirm() {
    var deletecon = confirm('Are you sure you want to delete this note?');
    if(deletecon == true) {
        chrome.runtime.sendMessage({
            message: 'delete_note',
            payload: {
                "videoTime": del_time.toString(),
                "videoID": videoID
            }
        });
        console.log("Delete request sent");
    }
}

function pause() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "pause_video"}, null);
    });
};

function get_title() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "get_title"}, function(response) {
            if (response) {
                videoTitle.innerHTML = response.value;
            };
        });
    });
};

function get_time() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "get_time"}, function(response) {
            if (response) {
                currentTime = response.value;
            };
        });
    });
};