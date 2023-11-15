// Your JavaScript code goes here
var lastObj = {};
console.log("[SWORD] Ready for:", window.location.href);

doIt();


async function snapshot() {
  var jso = document.querySelector("#krn_blockify_field_5877412aa9616_post_content");
  if(jso) {
    try {
      jso = JSON.parse(jso.value);
    } catch(e) {
      jso ={}
    }
  } else {
    return;
  }
  if(deepEqual(jso, lastObj)) {
    return;
  }
  lastObj = jso;
  var records = await chrome.storage.local.get();
  if(!records) {
    records = {data:[]}
  }
  if(!records.data) {
    records.data = [];
  }
  records.data.unshift(jso);


  var saved = chrome.storage.local.set({
    data: records.data
  });
  var load = await chrome.storage.local.get();
  console.log("[SWORD]", load);

}

function   deepEqual(a, b) {
    var self = this;
    // If both are the same value (including both being null or undefined), return true.
    if (a === b) return true;

    // If either of them is not an object or is null, return false.
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // If the number of keys is different, return false.
    if (keysA.length !== keysB.length) return false;

    for (let key of keysA) {
        if (!keysB.includes(key)) return false;  // Key not found in the second object
        if (!deepEqual(a[key], b[key])) return false;  // Values are not deeply equal
    }

    return true;
  }


async function doIt() {
  if(!window.location.href.match("wp.krone.at.*post_type=article")) {
    return;
  }
  // var store = await chrome.storage.local.set({
  //   obj: 1,
  // });

  console.log("[SWORD] inpage");
  setInterval(async () =>  {
    snapshot();
  }, 2000);
}
