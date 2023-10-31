var KRNSnapshot = {
  version: "1_0",
  roughSizeOfObject: function(object) {
    var objectList = [];

    var recurse = function(value) {
      var bytes = 0;

      if (typeof value === "boolean") {
        bytes = 4;
      } else if (typeof value === "string") {
        bytes = value.length * 2;
      } else if (typeof value === "number") {
        bytes = 8;
      } else if (
        typeof value === "object" &&
        objectList.indexOf(value) === -1
      ) {
        objectList[objectList.length] = value;

        for (var i in value) {
          bytes += 8; // an assumed existence overhead
          bytes += recurse(value[i]);
        }
      }

      return bytes;
    };

    return recurse(object);
  },
  init: function() {
    var self = this;
    self.lastObj = {};
    
    jQuery(document).on("submit", "form", function() {
      //if ($(this).hasClass("is-validating")) {
        self.make();
      //}
    });
    jQuery(window).on("resize", self.fixTBSize);
    jQuery(document).on("click", ".krn-recover-this", function() {
      var idx = jQuery(this).data("recovery-id");
      self.recover(parseInt(idx));
    });
    jQuery(document).on("click", ".krn-copy-this", function() {
      var idx = jQuery(this).data("recovery-id");
      self.copyArticle(parseInt(idx));
    });

    self.showFAB();
    self.autoSave();
  },
  autoSave: function() {
    var self = this;
    self.autoSaveInterval = window.setInterval(function() {
      self.make();
    }, 1000 * 60 * 1);
  },
  showFAB: function() {
    var self = this;
    if (!document.location.href.match(/(post\-new|post).php/)) {
      return;
    }

    window.onbeforeunload = function() {
      KRNSnapshot.make();
      return;
    };

    var keyName = self.version + jQuery("[name=post_type]").val();
    idbKeyval.get(keyName).then(function(d) {
      if (d) {
        jQuery("body").append(
          '<div class="fab" id="idb_article_recover"> <span style="font-size:20px;" class="dashicons dashicons-shield"></span> </div>'
        );
        jQuery("#idb_article_recover").on("click", function() {
          self.showUI();
        });
      }
    });
  },
  deepEqual: function(a, b) {
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
        if (!self.deepEqual(a[key], b[key])) return false;  // Values are not deeply equal
    }

    return true;
  },
  make: function() {
    var self = this;

    var keyName = self.version + jQuery("[name=post_type]").val();
    if (self.SKIP_SNAPSHOT) return;
    $("#idb_article_recover span").css("animation", "none");
    window.setTimeout(function() {
      $("#idb_article_recover span").css("animation", "spin 0.3s linear 2");
    }, 10);

    var data = jQuery("#post").serializeArray();
    if (data.length > 1) {
      var filtered = data.filter(function(w) {
        if (w.name.match(/nonce/)) {
          return false;
        }
        if (w.name.match(/^_/)) {
          return false;
        }
        if (w.name.match(/^post_ID$/)) {
          return false;
        }
        return true;
      });
      var obj = {
        created_at: new Date(),
        payload: filtered,
        post_title: jQuery("[name=post_title]").val(),
        type: keyName
      };
      var cobj = {
        d: filtered,
        post_title: obj.post_title,
        type: keyName
      }
      if(self.deepEqual(cobj, self.lastObj)) {
        console.log("SNAPSHOT REJECTED -> same Obj: ", self.lastObj);
        return;
      }

      self.lastObj = cobj;

      idbKeyval.get(keyName).then(function(d) {
        if (d) {
          d.push(obj);
        } else {
          d = [obj];
        }
        d = d.slice(-5);
        idbKeyval.set(keyName, d);
        console.log("SNAPSHOT MADE");
      });
    }
  },
  SKIP_SNAPSHOT: false,
  fixTBSize: function() {
    var tb = document.getElementById("TB_ajaxContent");
    if (tb) {
      // set the attribute to an empty string or your desired width/height.
      tb.setAttribute("style", "");
    }
  },
  showUI: function() {
    var self = this;
    var postType = jQuery("[name=post_type]").val();
    var keyName = self.version + postType;

    idbKeyval.get(keyName).then(function(a) {
      jQuery("#krn-snapshot-ui").remove();
      var list = "";
      if (a) {
        var list = [];
        a.forEach(function(entry, idx) {
          var copyLink = "";
          if(postType == "article") {
              copyLink = '&nbsp; &nbsp; <a href="#" data-recovery-id="' + idx + '" class="krn-copy-this">Kopieren</a>';
          }
          var t = entry.post_title;
          var lel = "";
          lel += "<tr><td>" + t + " </td>";
          lel += "<td>" + entry.created_at.toLocaleString() + "</td>";
          lel += "<td>" + self.roughSizeOfObject(entry.payload) + "</td>";
          lel +=
            "<td><a href='#' data-recovery-id='" +
            idx +
            "' class='krn-recover-this'>Wiederherstellen</a>" + copyLink + "</td>";
          lel += "</tr>";
          list.push(lel);
        });
        var olist = list.reverse().join(" ");

        var UI =
          "<div id='krn-snapshot-ui' style='display:none;'><table class='wp-list-table widefat fixed striped posts'><thead><th scope=col class=column-description>Title</th><th scope=col class=column-description>Date</th><th scope=col class=column-description>Size</th><th scope=col class=column-description>Action</th></thead></thead><tbody>" +
          olist +
          "</tbody></table></div>";
        jQuery("body").append(UI);
        tb_show("WTF 🚀", "#TB_inline?inlineId=krn-snapshot-ui");
        self.fixTBSize();
      }
    });
  },
  copyArticle: function(idx) {
    var self = this;
    var keyName = self.version + jQuery("[name=post_type]").val();
    idbKeyval.get(keyName).then(function(d) {
      if (d) {
        d = d[idx];
        //HACKY
        //remove authorline, as it has a fixed value with some weird index
        console.log(d);

        title = d.payload.filter((e) => e.name == "post_title")[0].value;
        pretitle = d.payload.filter((e) => e.name == "acf[field_58d28bbcc002a]")[0].value;
        lead_raw = d.payload.filter((e) => e.name == "acf[field_58d383cf121c6]")[0].value;
        bodies_raw = d.payload.filter((e) => e.name == "acf[field_5877412aa9616]")[0].value;
        featured_raw = d.payload.filter((e) => e.name == "acf[field_58eb25d2d1690]")[0].value;
        json_bodies = JSON.parse(bodies_raw);
        bodies = "";
        lead = "";
        lead_bodies = JSON.parse(lead_raw);

        lead_bodies.forEach((b) => {
            if(b.meta.name == "tinymce_lead") {
              if(b.meta._custom.content) {
                lead = "<b><p>" + b.meta._custom.content + "</p></b>";
              }
            }
        });

        json_bodies.forEach((b) => {
            if(b.meta.name == "tinymce") {
              if(b.meta._custom.content) {
                bodies += "<p>" + b.meta._custom.content + "</p>";
              }
            }
        });
        var im = false;
        if(featured_raw.length > 0) {
          featured_json = JSON.parse(featured_raw);
          if(featured_json.length > 0) {
            im = "https://imgl.krone.at/scaled/" + featured_json[0].id + "/v020adb/630x356.jpg";
          }
        }


        var combinedContent = '';
        combinedContent += "<b><font color=red>" + pretitle + "</font></b><br>";
        combinedContent += "<b><font color=black size=20>" + title + "</font></b><br><br>";
        if(im) {
          combinedContent += '<img width=630 src="' + im + '"><br>';
        }
        combinedContent += "<b><p>" + lead + "</b></p>";
        combinedContent += bodies;



        window.getSelection().removeAllRanges();


        var tempElement = document.createElement('div');
        tempElement.style.backgroundColor="white";
        tempElement.style.fontSize="14px";

        tempElement.innerHTML = combinedContent;
        console.log(combinedContent);
        document.body.appendChild(tempElement);

        var range = document.createRange();
        range.selectNode(tempElement);
        window.getSelection().addRange(range);

        try {
          // Copy the selected content to the clipboard
          document.execCommand('copy');
          console.log('Content copied to clipboard.');
          alert("Text in Zwischenablage kopiert!");
        } catch (err) {
          console.error('Unable to copy to clipboard: ', err);
        }

        window.getSelection().removeAllRanges();
        document.body.removeChild(tempElement);




      }
    });
  },
  recover: function(idx) {
    var self = this;
    var keyName = self.version + jQuery("[name=post_type]").val();
    idbKeyval.get(keyName).then(function(d) {
      if (d) {
        d = d[idx];
        var c = confirm(
          "You are going to recover '" +
            d.post_title +
            "' from '" +
            d.created_at +
            "'\n " +
            d.type +
            " will be recovered and saved!"
        );
        if (!c) return;
        //HACKY
        //remove authorline, as it has a fixed value with some weird index
        jQuery(".acf-field-58d289cec36e3").remove();
        d.payload.forEach(function(field) {
          var htmlfield = jQuery("[name='" + field.name + "']");
          if (htmlfield.length <= 0) {
            jQuery("#post").append(
              "<input type=hidden name='" + field.name + "'>"
            );
            htmlfield = jQuery("[name='" + field.name + "']");
          }
          htmlfield.val(field.value);
        });
        self.SKIP_SNAPSHOT = true;
        jQuery("#post").submit();
      }
    });
  }
};
jQuery(document).ready(function() {
  KRNSnapshot.init();
  KRNSnapshot.make();
});
