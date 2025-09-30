// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("testBtn");
  const status = document.getElementById("status");

  btn.addEventListener("click", () => {
    status.textContent = "Applying...";
    console.log("Popup: button clicked");

    // choose one color for the whole page
    const color_list = ["red", "blue", "white", "green", "purple", "pink", "black", "gray", "yellow"];
    const chosenColor = color_list[Math.floor(Math.random() * color_list.length)];
    console.log("Popup: chosen color =", chosenColor);

    // find the active tab and inject
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        console.error("Popup: no active tab found");
        status.textContent = "No active tab";
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (color) => {
          // ---------- injection starts here (runs in page context) ----------
          // helper: apply color to all elements under a root (Document or ShadowRoot)
          const applyColorToRoot = (root) => {
            try {
              root.querySelectorAll("*").forEach(el => {
                try {
                  el.style.setProperty("color", color, "important");
                } catch (e) { /* ignore elements that throw */ }

                // recurse into shadow roots if present
                if (el.shadowRoot) {
                  applyColorToRoot(el.shadowRoot);
                }
              });
            } catch (e) {
              // root.querySelectorAll might throw on some weird roots — ignore
            }
          };

          // If already applied, update the color and return
          if (window.__readingModeApplied) {
            window.__readingModeColor = color;
            // update existing elements quickly
            applyColorToRoot(document);
            // update style element for pseudo-elements if present
            if (window.__readingModeStyleEl) {
              window.__readingModeStyleEl.textContent = `*::before, *::after { color: ${color} !important; }`;
            }
            console.log("Injected: updated reading color to", color);
            return;
          }

          // mark applied and store color
          window.__readingModeApplied = true;
          window.__readingModeColor = color;

          // initial application on main document
          applyColorToRoot(document);

          // pseudo-elements override via injected stylesheet
          try {
            const styleEl = document.createElement("style");
            styleEl.setAttribute("data-reading-mode", "true");
            styleEl.textContent = `*::before, *::after { color: ${color} !important; }`;
            (document.head || document.documentElement).appendChild(styleEl);
            window.__readingModeStyleEl = styleEl;
          } catch (e) {
            console.warn("Injected: failed to add pseudo-element style", e);
          }

          // handle same-origin iframes
          document.querySelectorAll("iframe").forEach(frame => {
            try {
              const doc = frame.contentDocument;
              if (doc) {
                applyColorToRoot(doc);
                // try to inject pseudo style into iframe as well
                try {
                  const s = doc.createElement("style");
                  s.setAttribute("data-reading-mode", "true");
                  s.textContent = `*::before, *::after { color: ${color} !important; }`;
                  (doc.head || doc.documentElement).appendChild(s);
                } catch (e) {
                  /* ignore iframe style failures */
                }
              }
            } catch (e) {
              // cross-origin iframes will throw; ignore them safely
              console.warn("Injected: cannot access cross-origin iframe", e);
            }
          });

          // Setup a MutationObserver to reapply to new content (avoid duplicates)
          const observerCallback = (mutations) => {
            // simple, cheap reapplication when DOM changes
            try {
              applyColorToRoot(document);
            } catch (e) {}
          };

          try {
            const observer = new MutationObserver(observerCallback);
            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
            window.__readingModeObserver = observer;
            console.log("Injected: MutationObserver started");
          } catch (e) {
            console.warn("Injected: failed to start MutationObserver", e);
          }

          console.log("Injected: reading mode applied with color", color);
          // ---------- injection ends here ----------
        },
        args: [chosenColor]
      }).then(() => {
        status.textContent = `Applied (${chosenColor})`;
        console.log("Popup: injection promise resolved");
      }).catch(err => {
        console.error("Popup: injection failed", err);
        status.textContent = "Injection failed";
      });
    });
  });
});
