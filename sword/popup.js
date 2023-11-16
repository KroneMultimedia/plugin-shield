window.onload = async function() {
  updateStorageInfo();
}

chrome.storage.onChanged.addListener(async function() {
    updateStorageInfo();
});

async function updateStorageInfo() {

  var records = await chrome.storage.local.get();
  
  if(records) {
    if(records.data) {
      debugger;
      var l = records.data.length;
      var last = records.data[0].time.d;


      document.querySelector("#last_date").innerText = last;
      document.querySelector("#amount").innerText = l;

    }
  }
}

function chunkArray(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

document.getElementById('export').addEventListener('click', async function() {
  // Get data from Chrome local storage
  const records = await chrome.storage.local.get();

  // Convert the JSON object to a JSON string
  const jsonString = JSON.stringify(records, null, 2);

  // Create a Blob with the JSON data
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create a download link
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = 'sword.json'; // Specify the desired filename

  // Programmatically trigger a click event on the anchor element
  if (document.createEvent) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, false);
    downloadLink.dispatchEvent(event);
  } else {
    downloadLink.click();
  }


  /*
  fetch("https://webhook.site/d60f7645-6696-4491-abc6-5c660839b02c", {method: "POST", body: JSON.stringify(records)})
  .then(r => r.text())
  .then(t => {
      console.log(t);
  }).catch(e => {
      console.log("[SWORD] failed");
  });
  */

});

document.getElementById('clear').addEventListener('click',  function() {
    var d = window.confirm("Localen Zwischenstand löschen?")
    if(d) {
        var records = chrome.storage.local.set({}).then(d => {
            console.log("DONE");
        });

    }
});
