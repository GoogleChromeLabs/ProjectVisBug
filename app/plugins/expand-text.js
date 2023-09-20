export const commands = [
  'expand-text',
]

export const description = 'simulate translated text expansion based on a w3.org table'

export default async function() {
  const settings = {
    expanded: true,
    predictableMode: false,
  };
  
  const accents = "̟́";
  
  console.log(
    "Reference expansion table: https://www.w3.org/International/articles/article-text-size"
  );
  
  alert(
    'Click on the page, then: \n\nhit the Ctrl key to toggle translation size expansion, or \n\nhit the Shift key to toggle random insertion of spaces.'
  );
  
  englishToExpectedEuropeanLanguageExpansionSize();
  
  document.body.addEventListener("keydown", function (event) {
    if (event.ctrlKey) {
      settings.expanded = !settings.expanded;
      if (settings.expanded) {
        englishToExpectedEuropeanLanguageExpansionSize();
      } else {
        backToEnglishSize();
      }
    } else if (event.shiftKey) {
      settings.predictableMode = !settings.predictableMode;
      if (settings.predictableMode) {
        alert("Spaces will NOT be randomly included.");
      } else {
        alert("Spaces WILL be randomly included.");
      }
    }
  });
  
  function englishToExpectedEuropeanLanguageExpansionSize() {
    const elementsWithText = [...document.querySelectorAll("body *")]
      .filter((el) => hasText(el))
      .reverse();
    elementsWithText.forEach((el) => setExpandedSizeText(el));
  }
  
  function backToEnglishSize() {
    const elementsWithText = [...document.querySelectorAll("body *")]
      .filter((el) => hasText(el))
      .reverse();
    elementsWithText.forEach((el) => setEnglishSizeText(el));
  }
  
  function hasText(element) {
    return (
      element.innerText && element.innerText.trim() && hasChildTextNode(element)
    );
  }
  
  function hasChildTextNode(element) {
    return [...element.childNodes].some((n) => n.nodeType === Node.TEXT_NODE);
  }
  
  function setEnglishSizeText(element) {
    const elementData = element.getAttribute(
      "data-englishToExpectedEuropeanLanguageExpansionSize"
    );
    if (elementData) {
      const originalLength = JSON.parse(elementData).originalLength;
      const expandedLength = JSON.parse(elementData).expandedLength;
      const difference = expandedLength - originalLength;
      const multiplier = 1 + accents.length;
      element.innerHTML = element.innerHTML.slice(0, -difference * multiplier);
    }
  }
  
  function setExpandedSizeText(element) {
    const elementData = element.getAttribute(
      "data-englishToExpectedEuropeanLanguageExpansionSize"
    );
    const alreadyExpanded =
      elementData ||
      element.querySelectorAll(
        "[data-englishToExpectedEuropeanLanguageExpansionSize]"
      ).length;
    if (alreadyExpanded) {
      if (
        element.hasAttribute(
          "data-englishToExpectedEuropeanLanguageExpansionSize"
        )
      ) {
        const originalLength = JSON.parse(elementData).originalLength;
        const expandedLength = JSON.parse(elementData).expandedLength;
        element.innerHTML = element.innerHTML.slice(0, originalLength);
        element.innerHTML += getExpandedString(expandedLength - originalLength);
      }
    } else {
      const originalHtmlLength = element.innerHTML.length;
      const originalLength = element.innerText.trim().length;
      const expandedLength = useExpansionTable(element.innerText.trim());
      const difference = expandedLength - originalLength;
      element.innerHTML += getExpandedString(difference);
      const data = {
        originalLength: originalHtmlLength,
        expandedLength: originalHtmlLength + difference,
      };
      element.setAttribute(
        "data-englishToExpectedEuropeanLanguageExpansionSize",
        JSON.stringify(data)
      );
    }
  }
  
  function useExpansionTable(englishText) {
    let expandedLength = englishText.length;
    if (englishText.length <= 10) {
      expandedLength = englishText.length * 3;
    } else if (englishText.length <= 20) {
      expandedLength = englishText.length * 2;
    } else if (englishText.length <= 30) {
      expandedLength = englishText.length * 1.8;
    } else if (englishText.length <= 50) {
      expandedLength = englishText.length * 1.6;
    } else if (englishText.length <= 70) {
      expandedLength = englishText.length * 1.7;
    } else if (englishText.length > 70) {
      expandedLength = englishText.length * 1.3;
    }
    return Math.ceil(expandedLength);
  }
  
  function getExpandedString(length) {
    let output = "";
    const abc = "abcdefghijklmnopqrstuvwxyz";
    const chanceOfSpace = settings.predictableMode ? 0 : 0.1;
    let i = 0;
    while (i < length) {
      const notLastCharacter = i < length - 1;
      const precededBySpace = i > 0 && output[i - 1] === " ";
      if (
        notLastCharacter &&
        !precededBySpace &&
        Math.random() >= 1 - chanceOfSpace
      ) {
        output += " " + accents;
      } else {
        output += abc[i % 26] + accents;
      }
      i++;
    }
    return output;
  }
}
