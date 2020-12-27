let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log(`Success! ${event.type}`);

  // check if app is online before reading from db
  if (navigator.onLine) {
    databaseCheck();
  }
};


request.onerror = function (event) {
  console.log("Uh oh... " + event.target.errorCode);
};

function saveRecord(record) {
  // create transaction with readwrite ability
  const transaction = db.transaction(["pending"], "readwrite");

  // access objects
  const store = transaction.objectStore("pending");

  // store record
  store.add(record);
}

function databaseCheck() {
  // transaction creation
  const transaction = db.transaction(["pending"], "readwrite");
  // identify pending items
  const store = transaction.objectStore("pending");
  //pull all records
  const getAll = store.getAll();

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
          //open transaction
          const transaction = db.transaction(["pending"], "readwrite");

          // access items
          const store = transaction.objectStore("pending");

          // clear store
          store.clear();
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", databaseCheck);