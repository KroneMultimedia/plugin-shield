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
    
    jQuery(document).on("submit", "form", function() {
      if ($(this).hasClass("is-validating")) {
        self.make();
      }
    });
    jQuery(window).on("resize", self.fixTBSize);
    jQuery(document).on("click", ".krn-recover-this", function() {
      var idx = jQuery(this).data("recovery-id");
      self.recover(parseInt(idx));
    });
    self.showFAB();
    self.autoSave();
  },
  autoSave: function() {
    var self = this;
    self.autoSaveInterval = window.setInterval(function() {
      self.make();
    }, 1000 * 60 * 3);
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
  make: function() {
    var self = this;
    console.log("SNAPSHOT MADE");
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
      idbKeyval.get(keyName).then(function(d) {
        if (d) {
          d.push(obj);
        } else {
          d = [obj];
        }
        d = d.slice(-5);
        idbKeyval.set(keyName, d);
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
    var keyName = self.version + jQuery("[name=post_type]").val();

    idbKeyval.get(keyName).then(function(a) {
      jQuery("#krn-snapshot-ui").remove();
      var list = "";
      if (a) {
        var list = [];
        a.forEach(function(entry, idx) {
          var t = entry.post_title;
          var lel = "";
          lel += "<tr><td>" + t + " </td>";
          lel += "<td>" + entry.created_at.toLocaleString() + "</td>";
          lel += "<td>" + self.roughSizeOfObject(entry.payload) + "</td>";
          lel +=
            "<td><a href='#' data-recovery-id='" +
            idx +
            "' class='krn-recover-this'>Recover</a></td>";
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
});
