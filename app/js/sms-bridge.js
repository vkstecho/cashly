/* Cashly – Capacitor SMS bridge
 * Works in two modes:
 *  1) Browser / PWA  → paste / clipboard (existing openSMSImport)
 *  2) Capacitor Android with SmsInbox plugin → native read
 *
 * Android plugin expected API (custom plugin com.vkstech.cashly.SmsInbox):
 *   SmsInbox.checkPermission() -> { status: 'granted'|'denied'|'prompt' }
 *   SmsInbox.requestPermission() -> { status: 'granted'|'denied' }
 *   SmsInbox.read({ max?: number, bodyContains?: string }) -> { messages: [{body, address, date}] }
 */
(function (global) {
  var SmsBridge = {
    isNative: function () {
      return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
    },
    plugin: function () {
      try {
        if (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.SmsInbox) {
          return global.Capacitor.Plugins.SmsInbox;
        }
        // Capacitor 6 registerPlugin style
        if (global.Capacitor && global.Capacitor.registerPlugin) {
          return global.Capacitor.registerPlugin("SmsInbox");
        }
      } catch (e) {}
      return null;
    },
    checkPermission: async function () {
      var p = this.plugin();
      if (!p || !p.checkPermission) return { status: "unavailable" };
      return p.checkPermission();
    },
    requestPermission: async function () {
      var p = this.plugin();
      if (!p || !p.requestPermission) return { status: "unavailable" };
      return p.requestPermission();
    },
    readRecent: async function (opts) {
      opts = opts || {};
      var p = this.plugin();
      if (!p || !p.read) return { messages: [], error: "plugin_unavailable" };
      return p.read({
        max: opts.max || 50,
        bodyContains: opts.bodyContains || "Rs"
      });
    },
    /** High-level: try native SMS → parse → return transactions. Falls back to null. */
    importFromNative: async function () {
      if (!this.isNative()) return null;
      var perm = await this.checkPermission();
      if (perm.status !== "granted") {
        perm = await this.requestPermission();
      }
      if (perm.status !== "granted") {
        return { error: "permission_denied", messages: [] };
      }
      var res = await this.readRecent({ max: 40, bodyContains: "Rs" });
      var messages = (res && res.messages) || [];
      var parsed = [];
      messages.forEach(function (m) {
        var p = typeof parseIndianBankSMS === "function" ? parseIndianBankSMS(m.body || "") : null;
        if (p) {
          p.sourceAddress = m.address || "";
          p.smsDate = m.date || null;
          parsed.push(p);
        }
      });
      return { messages: messages, parsed: parsed };
    }
  };

  global.SmsBridge = SmsBridge;

  /** Enhanced openSMSImport: prefer native when available */
  var _origOpen = global.openSMSImport;
  global.openSMSImport = async function () {
    if (SmsBridge.isNative() && SmsBridge.plugin()) {
      try {
        if (typeof toast === "function") toast("Reading SMS…");
        var result = await SmsBridge.importFromNative();
        if (result && result.error === "permission_denied") {
          if (typeof toast === "function") toast("SMS permission denied");
          if (typeof _origOpen === "function") _origOpen();
          return;
        }
        if (result && result.parsed && result.parsed.length) {
          window._smsParsed = result.parsed;
          // Show preview modal
          var html = '<div class="mh"><span class="xmt">SMS Import</span><button class="xmc" onclick="cM()">×</button></div>';
          html += '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Found ' + result.parsed.length + ' bank SMS</div>';
          html += '<div id="smsPreview"></div>';
          var m = document.getElementById("ML");
          if (m) m.innerHTML = html;
          var ov = document.getElementById("OV");
          if (ov) ov.classList.remove("hidden");
          // reuse preview renderer
          var box = document.getElementById("smsPreview");
          if (box && typeof runSMSParse === "function") {
            // manually render
            var h = '<div style="font-weight:700;font-size:14px;margin-bottom:10px">Detected ' + result.parsed.length + '</div>';
            result.parsed.forEach(function (p) {
              h += '<div class="set-card" style="padding:10px 12px"><div class="set-text"><div class="set-title">' +
                (typeof esc === "function" ? esc(p.note) : p.note) + ' · ' + p.type + '</div><div class="set-sub">' + p.date +
                '</div></div><div style="font-weight:700">' + (typeof fF === "function" ? fF(p.amount) : p.amount) + '</div></div>';
            });
            h += '<button class="sub" style="margin-top:12px" onclick="importParsedSMS()">Import all</button>';
            h += '<button class="eb" style="margin-top:8px;width:100%" onclick="cM();setTimeout(function(){if(window._openSMSPaste)window._openSMSPaste()},200)">Paste manually instead</button>';
            box.innerHTML = h;
          }
          return;
        }
      } catch (e) {
        console.warn("Native SMS failed", e);
      }
    }
    // Fallback to paste UI
    if (typeof _origOpen === "function") _origOpen();
  };
  global._openSMSPaste = global.openSMSImport;
})(typeof window !== "undefined" ? window : globalThis);
