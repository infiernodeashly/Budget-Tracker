let db;
// Open database. Start at version 1. 
const request = indexedDB.open("budget", 1);

//---
//Loading and checking database for data. 
request.onupgradeneeded = function (event) {
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};
//begins what to do with the results upon successful completion.
request.onsuccess = function (event) {
  db = event.target.result;

  // if app online, read data from the database. checkDatabase function outlined below.
  if (navigator.onLine) {
    checkDatabase();
  }
};
//if error, return "Uh oh! Please google + error code"
request.onerror = function (event) {
  console.log("Uh oh! Please google " + event.target.errorCode);
};
//---

//---
//creates function for saving a record. 
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to store.
  store.add(record);
}
//---

//---
//checkDatabase method referenced upon loading.
function checkDatabase() {
  // open a read/write transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();
  // when the system successfully pulls the results, if there is at least one item returned, fet the listed link. Then send the results 
  //as a JSON object to the listed link. If successful, open a transaction on the database, access the pending object store and clear items in store.
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // access your pending object store
          const store = transaction.objectStore("pending");

          // clear all items in your store
          store.clear();
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", checkDatabase);