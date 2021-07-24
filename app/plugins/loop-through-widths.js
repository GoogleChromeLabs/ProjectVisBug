// https://github.com/hchiam/learning-js/blob/master/bookmarklets/autoResizeWindowToTestMediaQueries.js

export const commands = [
  'loop through widths',
  'loop thru widths',
]

export const description = 'loops through screen widths in a popup'

export default async function() {

  const test = (function () {
    let keepGoing = true;
    let popup;
    const maxWidth = screen.width;
    const minWidth = 152;
    let goWider = true;

    openPopup();
    go();

    popup.onbeforeunload = function () {
      stop();
      console.log("Stopped timer.");
    };

    function openPopup() {
      popup = window.open(location.href, "_blank", "width=100, top=0, left=0");
    }

    function wider() {
      popup.resizeBy(5, 0);
    }

    function thinner() {
      popup.resizeBy(-5, 0);
    }

    function stop() {
      keepGoing = false;
    }

    function go() {
      keepGoing = true;
      console.log("Popup will start looping thru screen widths in 3 seconds.");
      popup.focus();
      setTimeout(function () {
        scanWidths();
        const codeStyle = 'background: black; color: lime;'
        const resetStyle = 'background: inherit; color: inherit;'
        console.log(
          "You can run %ctest.stop()%c to stop, and \n%ctest.go()%c to continue.",
          codeStyle, resetStyle, codeStyle, resetStyle
        );
      }, 3000);
    }

    function scanWidths() {
      const timer = setInterval(function () {
        if (!keepGoing) {
          clearTimeout(timer);
          popup.focus();
        }
        if (maxWidth <= popup.outerWidth) {
          goWider = false;
        } else if (popup.outerWidth <= minWidth) {
          goWider = true;
        }
        if (goWider) {
          wider();
        } else {
          thinner();
        }
      }, 100);
    }

    return {
      stop,
      go,
      popup
    };

  })();

  if (typeof window !== "undefined") window.test = test;
}