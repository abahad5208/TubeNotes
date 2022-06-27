// cache for Promise-wrapped `db` object
let dbPromise = null;

let notes = [{
    "videoID": "bUSDQLEjW_M",
    "videoTime": "249.201749",
    "videoTitle": "Using A Local Database(IndexedDB) with A Google Chrome Extension",
    "noteTitle": "Creating the Database",
    "noteContent": "The database is created with some test data already available. Everything else is aready set-up."
},
{
    "videoID": "bUSDQLEjW_M",
    "videoTime": "713.241816",
    "videoTitle": "Using A Local Database(IndexedDB) with A Google Chrome Extension",
    "noteTitle": "Creating the CRUD Functions",
    "noteContent": "The functions to create, read, update, and delete are created."
},
{
    "videoID": "feTP7GgjzU0",
    "videoTime": "83.008601",
    "videoTitle": "Appease an Eyeball Demon & Discover Your Dark Secret in these 2 Freaky Pixel Art Horror Games!",
    "noteTitle": "Jumpscare 1",
    "noteContent": "Loud noise when turning on the light in the bathroom."
},
{
    "videoID": "feTP7GgjzU0",
    "videoTime": "146.9342",
    "videoTitle": "Appease an Eyeball Demon & Discover Your Dark Secret in these 2 Freaky Pixel Art Horror Games!",
    "noteTitle": "Jumpscare 2",
    "noteContent": "Eyeball demon appears to make some demands."
},
{
    "videoID": "feTP7GgjzU0",
    "videoTime": "245.970566",
    "videoTitle": "Appease an Eyeball Demon & Discover Your Dark Secret in these 2 Freaky Pixel Art Horror Games!",
    "noteTitle": "Second game starts",
    "noteContent": "Start of the second game."
},
{
    "videoID": "bUSDQLEjW_M",
    "videoTime": "1292.889627",
    "videoTitle": "Using A Local Database(IndexedDB) with A Google Chrome Extension",
    "noteTitle": "First test",
    "noteContent": "Testing if the database is created and pre-defined records inserted correctly"
},
]

// listener (top-level code)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.message === 'get_notes') {
        if(!dbPromise) {
            dbPromise = create_database()
            .catch(error => {
                console.log(error);
                throw error;
            });
        };

        dbPromise // read the cached promise and chain .then().then() .
        .then(db => get_records(db, request.payload))
        .then(res => {
            chrome.runtime.sendMessage({
                'message': 'getNotes_success',
                'payload': res
            });
        })
        .catch(error => { // catch to avoid unhandled error exception
            console.log(error); // don't re-throw
        });

    } else if(request.message === 'get_videos') {
        if(!dbPromise) {
            dbPromise = create_database()
            .catch(error => {
                console.log(error);
                throw error;
            });
        };

        dbPromise // read the cached promise and chain .then().then() .
        .then(db => get_videos(db))
        .then(res => {
            chrome.runtime.sendMessage({
                'message': 'getVideos_success',
                'payload': res
            });
        })
        .catch(error => { // catch to avoid unhandled error exception
            console.log(error); // don't re-throw
        });

    } else if(request.message === 'add_note') {
        if(!dbPromise) {
            dbPromise = create_database()
            .catch(error => {
                console.log(error);
                throw error;
            });
        };

        dbPromise // read the cached promise and chain .then().then() .
        .then(db => insert_records(db, request.payload))
        .then(res => {
            chrome.runtime.sendMessage({
                'message': 'insertNote_success',
                'payload': res
            });
        })
        .catch(error => { // catch to avoid unhandled error exception
            console.log(error); // don't re-throw
        });

    } else if(request.message === 'edit_note') {
        if(!dbPromise) {
            dbPromise = create_database()
            .catch(error => {
                console.log(error);
                throw error;
            });
        };

        dbPromise // read the cached promise and chain .then().then() .
        .then(db => update_record(db, request.payload.videoID, request.payload.videoTime, request.payload.noteTitle, request.payload.noteContent))
        .then(res => {
            chrome.runtime.sendMessage({
                'message': 'editNotes_success',
                'payload': res
            });
        })
        .catch(error => { // catch to avoid unhandled error exception
            console.log(error); // don't re-throw
        });
    } else if(request.message === 'delete_note') {
        if(!dbPromise) {
            dbPromise = create_database()
            .catch(error => {
                console.log(error);
                throw error;
            });
        };

        dbPromise // read the cached promise and chain .then().then() .
        .then(db => delete_record(db, request.payload.videoID, request.payload.videoTime))
        .then(res => {
            chrome.runtime.sendMessage({
                'message': 'deleteNote_success',
                'payload': res
            });
        })
        .catch(error => { // catch to avoid unhandled error exception
            console.log(error); // don't re-throw
        });
    }
});

function create_database() {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('MyTestDB'); // scope of self?

        request.onerror = function(event) {
            reject(new Error('Problem opening DB.'));
        };

        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            let objectStore = db.createObjectStore('notes', {
                'keypath': 'id', 
                'autoIncrement': true
            });
            objectStore.createIndex('videoID, videoTime', ['videoID', 'videoTime'], {'unique': true});
            objectStore.transaction.oncomplete = function(event) {
                console.log('ObjectStore Created.');
                resolve(db);
            }
        };

        request.onsuccess = function(event) {
            let db = event.target.result;
            console.log('DB Opened.');
            
            resolve(db);
        };

    });
};

function delete_database() {
    const request = self.indexedDB.deleteDatabase('MyTestDB');

    request.onerror = function(event) {
        new Error('DB Deletion failed!');
    }

    request.onsuccess = function(event) {
        console.log("DB Deleted.")
    }

}

function get_records(db, vidID) {
    // first a couple of low-level utility functions to help keep the high-level code clean.
    getTransaction = function() {
        const get_transaction = db.transaction('notes', 'readonly');

        get_transaction.oncomplete = function() {
            console.log('All Get Notes Transactions Complete!');
        };

        get_transaction.onerror = function() {
            console.log('Problem Getting Notes!');
        };

        return get_transaction;
    };

    getAllAsync = function(transaction) {
        return new Promise((resolve, reject) => {
            const objectStore = transaction.objectStore('notes');
            let request = objectStore.index('videoID, videoTime').getAll(IDBKeyRange.bound([vidID], [vidID, []]));
            request.onsuccess = function(event) {
                resolve(event.target.result);
            }
            request.onerror = function(event) { // presumably
                reject(new Error('getAll Notes request failed'));
            }
        }); 
    };

    return getAllAsync(getTransaction(db));
};

function get_videos(db) {
    getVidTransaction = function() {
        const getVid_transaction = db.transaction("notes", "readonly");

        getVid_transaction.oncomplete = function() {
            console.log("All Get Videos Transactions Complete!");
        };

        getVid_transaction.onerror = function() {
            console.log("Problem Getting Videos!");
        };

        return getVid_transaction;
    };

    getVidAsync = function(transaction) {
        return new Promise((resolve, reject) => {
            const objectStore = transaction.objectStore('notes');
            let request = objectStore.index('videoID, videoTime').getAll();

            request.onsuccess = function(event) {
                var vidList = {};
                var rez = event.target.result;
                var len = rez.length;
                for(let i = 0; i < len; i++) {
                    if(!(vidList.hasOwnProperty(rez[i].videoID))) {
                        vidList[rez[i].videoID] = rez[i].videoTitle;
                    };
                };
                resolve(vidList);
            };

            request.onerror = function(event) { // presumably
                reject(new Error('getAll Videos request failed'));
            };
        }); 
    };
    
    return getVidAsync(getVidTransaction(db));
}

function insert_records(db, newNote) {
    insertTransaction = function() {
        const add_transaction = db.transaction('notes', 'readwrite');

        add_transaction.oncomplete = function() {
            console.log('All Insert Transactions Complete!');
        }
        add_transaction.onerror = function() {
            console.log('Problem Inserting Notes!');
        }

        return add_transaction;
    };

    addNoteAsync = function(transaction) {
        return new Promise((resolve, reject) => {
            const objectStore = transaction.objectStore('notes');

            newNote.forEach(note => {
                let request = objectStore.add(note);

                request.onsuccess = function() {
                    resolve(true);
                };
                request.onerror = function(event) { // presumably
                    reject(new Error('Insert note request failed!'));
                };
            });
        
        });
    };
    
    return addNoteAsync(insertTransaction(db));
}

function update_record(db, vID, tstamp, new_nTitle, new_nContent) {
    putTransaction = function() {
        const put_transaction = db.transaction('notes', 'readwrite');

        put_transaction.oncomplete = function() {
            console.log('All Update Transactions Complete!');
        }
        put_transaction.onerror = function() {
            console.log('Problem Updating Note!');
        }

        return put_transaction;
    };

    editNoteAsync = function(transaction) {
        return new Promise((resolve, reject) => {
            const objectStore = transaction.objectStore('notes');

            let dataReq = objectStore.index('videoID, videoTime').get(IDBKeyRange.bound([vID, tstamp], [vID, tstamp]));
            
            dataReq.onsuccess = function(event) {
                let data = event.target.result;

                data.noteTitle = new_nTitle;
                data.noteContent = new_nContent;

                let keyReq = objectStore.index("videoID, videoTime").getKey(IDBKeyRange.bound([vID, tstamp], [vID, tstamp]));

                keyReq.onsuccess = function(eventB) {
                    let putreq = objectStore.put(data, eventB.target.result);

                    putreq.onsuccess = function() {
                        resolve(true)
                    };
                    putreq.onerror = function(event) { // presumably
                        reject(new Error('Edit note request failed!'));
                    };
                };
            };
            dataReq.onerror = function(event) {
                reject(new Error('Could not retrieve note for editing!'));
            };
        });
    };
    
    return editNoteAsync(putTransaction(db));
}

// Deleting Notes Functions
function delete_record(db, vidID, timestamp) {
    deleteTransaction = function() {
        const delete_transaction = db.transaction("notes", "readwrite");

        delete_transaction.oncomplete = function() {
            console.log("All Delete Transactions Complete!");
        };

        delete_transaction.onerror = function() {
            console.log("Problem Deleting Notes!");
        };

        return delete_transaction;
    };

    deleteAsync = function(transaction) {
        return new Promise((resolve, reject) => {
            const objectStore = transaction.objectStore("notes");

            let request =  objectStore.index("videoID, videoTime").getKey(IDBKeyRange.bound([vidID, timestamp], [vidID, timestamp]));
            request.onsuccess = function(event) {
                let delreq = objectStore.delete(event.target.result);
                
                delreq.onsuccess = function() {
                    resolve(true);
                };

                delreq.onerror = function(event) {
                    reject(new Error('Delete Note request failed'));
                };
            };
        });
    };
    
    return deleteAsync(deleteTransaction(db));
}