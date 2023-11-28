// Your JavaScript code goes here
var lastObj = {};
var lastBlocks = [];
var lastForm = {};
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

  var blocks = [];
  document.querySelectorAll("#krn_blockify_field_5877412aa9616 .LIFY_block").forEach((e) => {
      blocks.push(e.innerHTML);
  });

  var formElement = document.querySelector('#post');
  var forms = serializeForm(formElement);


  if(deepEqual(jso, lastObj) && deepEqual(blocks, lastBlocks) && deepEqual(forms, lastForm)) {
    return;
  }


  lastForm = forms;
  lastBlocks = blocks;
  lastObj = jso;
  var records = await chrome.storage.local.get();
  if(!records) {
    records = {data:[]}
  }
  if(!records.data) {
    records.data = [];
  }
  var ts = new Date();
  records.data.unshift({
    json:  jso,
    blocks:  blocks,
    forms: forms,
    time: {
        ts: Math.floor(ts.getTime()/1000),
        d: ts.toLocaleTimeString(),
    },
  });

  records.data = records.data.splice(-100);


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
  if(!window.location.href.match(".*wp.krone.at.*")) {
    console.log("[SWORD] skip1", document.location.href);
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

function serializeForm(form) {
    var elements = form.elements;
    var formData = [];

    for (var i = 0; i < elements.length; i++) {
        var field = elements[i];

        // Skip fields without a name or which are disabled
        if (!field.name || field.disabled) {
            continue;
        }

        // Skip fields that are buttons or unchecked radio/checkboxes
        if (field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button' || ((field.type === 'checkbox' || field.type === 'radio') && !field.checked)) {
            continue;
        }

        // Handle multiple select options
        if (field.type === 'select-multiple') {
            for (var j = 0; j < field.options.length; j++) {
                var option = field.options[j];
                if (option.selected) {
                    formData.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(option.value));
                }
            }
        } else if (field.type !== 'file' && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button') {
            // All other field types, including text and textarea
            formData.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
        }
    }
    return formData.join('&');
}

