const fs = require("node:fs");
const path = require("node:path");

const lessonsPath = path.join(__dirname, "..", "src", "data", "lessons.json");
const shouldWrite = process.argv.includes("--write");

const subscriptMap = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "ₙ": "n",
  "ᵣ": "r",
  "₊": "+",
  "₋": "-",
};

const superscriptMap = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "ⁿ": "n",
  "ʳ": "r",
  "⁺": "+",
  "⁻": "-",
};

function translateCharacters(value, characterMap) {
  return [...value].map((character) => characterMap[character] ?? character).join("");
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&minus;/gi, "-")
    .replace(/&#8722;/gi, "-")
    .replace(/&amp;/gi, "&");
}

function convertCombinations(value) {
  return value.replace(
    /([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+)C([₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g,
    (_, top, bottom) =>
      `\\binom{${translateCharacters(top, superscriptMap)}}{${translateCharacters(bottom, subscriptMap)}}`,
  );
}

function convertSubscripts(value) {
  return value.replace(
    /([A-Za-z]+)([₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g,
    (_, base, subscript) => {
      const command = base === "log" ? "\\log" : base;
      return `${command}_{${translateCharacters(subscript, subscriptMap)}}`;
    },
  );
}

function convertUnicodePowers(value) {
  return value.replace(
    /([A-Za-z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿʳ⁺⁻]+)/g,
    (_, base, exponent) =>
      `${base}^{${translateCharacters(exponent, superscriptMap)}}`,
  );
}

function convertSupTags(value) {
  let result = value;
  const powerPattern = /(\([^<>]*?\)|[A-Za-z0-9π]+)<sup\b[^>]*>([\s\S]*?)<\/sup>/gi;

  while (powerPattern.test(result)) {
    powerPattern.lastIndex = 0;
    result = result.replace(
      powerPattern,
      (_, base, exponent) => `${base}^{${toLatex(exponent)}}`,
    );
  }

  return result;
}

function convertSubTags(value) {
  return value.replace(
    /([A-Za-z]+)<sub\b[^>]*>([\s\S]*?)<\/sub>/gi,
    (_, base, subscript) => {
      const command = base.toLowerCase() === "log" ? "\\log" : base;
      return `${command}_{${toLatex(subscript)}}`;
    },
  );
}

function convertFractionsToLatex(value) {
  const fractionPattern =
    /<span\s+class=(?:"math-frac"|'math-frac')\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/gi;

  return value.replace(
    fractionPattern,
    (_, numerator, denominator) =>
      `\\frac{${toLatex(numerator)}}{${toLatex(denominator)}}`,
  );
}

function convertRoots(value) {
  return value
    .replace(/√\(([^()]*)\)/g, (_, radicand) => `\\sqrt{${toLatex(radicand)}}`)
    .replace(/∛\(([^()]*)\)/g, (_, radicand) => `\\sqrt[3]{${toLatex(radicand)}}`)
    .replace(/√([A-Za-z0-9π₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g, (_, radicand) =>
      `\\sqrt{${toLatex(radicand)}}`,
    )
    .replace(/∛([A-Za-z0-9π₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g, (_, radicand) =>
      `\\sqrt[3]{${toLatex(radicand)}}`,
    );
}

function toLatex(value) {
  return convertUnicodePowers(
    convertSubscripts(
      convertCombinations(
        convertRoots(
          convertSubTags(convertSupTags(
            convertFractionsToLatex(
              decodeHtml(value).replace(/\[\[([\s\S]*?)\]\]/g, "$1"),
            )
              .replace(/<br\s*\/?>/gi, " ")
              .replace(/<\/?(?!sup\b)[a-z][^>]*>/gi, "")
              .replace(/×/g, "\\times ")
              .replace(/÷/g, "\\div ")
              .replace(/−/g, "-")
              .replace(/≤/g, "\\le ")
              .replace(/≥/g, "\\ge ")
              .replace(/±/g, "\\pm ")
              .replace(/≠/g, "\\ne ")
              .replace(/∞/g, "\\infty ")
              .replace(/π/g, "\\pi "),
          )),
        ),
      ),
    ),
  )
    .replace(/\\+(?=(?:log|sin|cos|tan)\b)/g, "\\")
    .replace(/(?<!\\)\blog(?=\s|\(|_|[A-Za-z0-9])/g, "\\log")
    .replace(/(?<!\\)\bsin(?=\s|\()/g, "\\sin")
    .replace(/(?<!\\)\bcos(?=\s|\()/g, "\\cos")
    .replace(/(?<!\\)\btan(?=\s|\()/g, "\\tan")
    .replace(/\s+/g, " ")
    .trim();
}

function findPowerBaseStart(value, endIndex) {
  let cursor = endIndex - 1;

  while (cursor >= 0 && /\s/.test(value[cursor])) {
    cursor -= 1;
  }

  if (value[cursor] === ")") {
    let depth = 0;
    for (let index = cursor; index >= 0; index -= 1) {
      if (value[index] === ")") depth += 1;
      if (value[index] === "(") depth -= 1;
      if (depth === 0) return index;
    }
  }

  if (value.slice(Math.max(0, cursor - 1), cursor + 1) === "]]" ) {
    return value.lastIndexOf("[[", cursor - 1);
  }

  while (cursor >= 0 && /[A-Za-z0-9π]/.test(value[cursor])) {
    cursor -= 1;
  }

  return cursor + 1;
}

function convertRemainingSupTags(value) {
  let result = value;
  const supPattern = /<sup\b[^>]*>([\s\S]*?)<\/sup>/i;
  let match = supPattern.exec(result);

  while (match) {
    const baseStart = findPowerBaseStart(result, match.index);
    const base = result.slice(baseStart, match.index).trimEnd();
    const replacement = `[[${toLatex(base)}^{${toLatex(match[1])}}]]`;
    result =
      result.slice(0, baseStart) +
      replacement +
      result.slice(match.index + match[0].length);
    match = supPattern.exec(result);
  }

  return result;
}

function convertSubscriptTags(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /([A-Za-z]+)<sub\b[^>]*>([\s\S]*?)<\/sub>/gi,
      (_, base, subscript) => {
        const command = base.toLowerCase() === "log" ? "\\log" : base;
        return `[[${command}_{${toLatex(subscript)}}]]`;
      },
    ),
  );
}

function convertRemainingRoots(value) {
  let result = value;
  let rootIndex = result.search(/[√∛]/);

  while (rootIndex >= 0) {
    const command = result[rootIndex] === "∛" ? "\\sqrt[3]" : "\\sqrt";
    let radicandStart = rootIndex + 1;
    let radicandEnd = radicandStart;

    if (result[radicandStart] === "(") {
      let depth = 0;
      for (let index = radicandStart; index < result.length; index += 1) {
        if (result[index] === "(") depth += 1;
        if (result[index] === ")") depth -= 1;
        if (depth === 0) {
          radicandStart += 1;
          radicandEnd = index;
          break;
        }
      }
    } else if (result.slice(radicandStart, radicandStart + 2) === "[[") {
      radicandStart += 2;
      radicandEnd = result.indexOf("]]", radicandStart);
    } else {
      while (
        radicandEnd < result.length &&
        /[A-Za-z0-9π₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]/.test(result[radicandEnd])
      ) {
        radicandEnd += 1;
      }
    }

    if (radicandEnd <= radicandStart) {
      break;
    }

    const closeLength = result.slice(rootIndex + 1, rootIndex + 3) === "[[" ? 2 : 0;
    const hasParentheses = result[rootIndex + 1] === "(";
    const replacement = `[[${command}{${toLatex(
      result.slice(radicandStart, radicandEnd),
    )}}]]`;
    result =
      result.slice(0, rootIndex) +
      replacement +
      result.slice(radicandEnd + closeLength + (hasParentheses ? 1 : 0));
    rootIndex = result.search(/[√∛]/);
  }

  return result;
}

function convertAbsoluteValues(value) {
  return value.replace(/\|([^|]+)\|/g, (_, expression) =>
    `[[\\lvert ${toLatex(expression)} \\rvert]]`,
  );
}

function convertInfinity(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(/([A-Za-z])∞/g, (_, base) => `[[${base}_{\\infty}]]`),
  );
}

function convertMathSymbols(value) {
  return replaceOutsideLatex(value, (part) =>
    part
      .replace(/±/g, "[[\\pm]]")
      .replace(/≤/g, "[[\\le]]")
      .replace(/≥/g, "[[\\ge]]")
      .replace(/≠/g, "[[\\ne]]")
      .replace(/∞/g, "[[\\infty]]")
      .replace(/π/g, "[[\\pi]]"),
  );
}

function replaceOutsideLatex(value, replacement) {
  return value
    .split(/(\[\[[\s\S]*?\]\])/g)
    .map((part) => (part.startsWith("[[") ? part : replacement(part)))
    .join("");
}

function convertFractions(value) {
  const fractionPattern =
    /<span\s+class=(?:"math-frac"|'math-frac')\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/gi;

  return value.replace(
    fractionPattern,
    (_, numerator, denominator) =>
      `[[\\frac{${toLatex(numerator)}}{${toLatex(denominator)}}]]`,
  );
}

function convertTaggedPowers(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /(\((?:[^()]|<[^>]+>)*?\)|[A-Za-z0-9π]+)<sup\b[^>]*>([\s\S]*?)<\/sup>/gi,
      (_, base, exponent) => `[[${toLatex(base)}^{${toLatex(exponent)}}]]`,
    ),
  );
}

function convertRootMarkers(value) {
  return replaceOutsideLatex(value, (part) =>
    part
      .replace(/√\(([^()]*)\)/g, (_, radicand) => `[[\\sqrt{${toLatex(radicand)}}]]`)
      .replace(/∛\(([^()]*)\)/g, (_, radicand) => `[[\\sqrt[3]{${toLatex(radicand)}}]]`)
      .replace(/√([A-Za-z0-9π₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g, (_, radicand) =>
        `[[\\sqrt{${toLatex(radicand)}}]]`,
      )
      .replace(/∛([A-Za-z0-9π₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g, (_, radicand) =>
        `[[\\sqrt[3]{${toLatex(radicand)}}]]`,
      ),
  );
}

function convertCombinationMarkers(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+)C([₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g,
      (_, top, bottom) =>
        `[[\\binom{${translateCharacters(top, superscriptMap)}}{${translateCharacters(bottom, subscriptMap)}}]]`,
    ),
  );
}

function convertSubscriptMarkers(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /([A-Za-z]+)([₀₁₂₃₄₅₆₇₈₉ₙᵣ₊₋]+)/g,
      (_, base, subscript) => {
        const command = base === "log" ? "\\log" : base;
        return `[[${command}_{${translateCharacters(subscript, subscriptMap)}}]]`;
      },
    ),
  );
}

function convertUnicodePowerMarkers(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /([A-Za-z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿʳ⁺⁻]+)/g,
      (_, base, exponent) =>
        `[[${base}^{${translateCharacters(exponent, superscriptMap)}}]]`,
    ),
  );
}

function convertNumericFractions(value) {
  return replaceOutsideLatex(value, (part) =>
    part.replace(
      /(^|[^A-Za-z0-9])(-?\d+)\s*\/\s*(\d+)(?![A-Za-z0-9])/g,
      (_, prefix, numerator, denominator) =>
        `${prefix}[[\\frac{${numerator}}{${denominator}}]]`,
    ),
  );
}

function convertMathString(value) {
  const normalized = value
    .replace(/<\/?(?:b|strong)\b[^>]*>/gi, "")
    .replace(/<span\s+class=(?:"math-bracket"|'math-bracket')\s*>\(<\/span>/gi, "(")
    .replace(/<span\s+class=(?:"math-bracket"|'math-bracket')\s*>\)<\/span>/gi, ")");

  return convertMathSymbols(convertAbsoluteValues(convertRemainingRoots(convertSubscriptTags(
    convertInfinity(convertRemainingSupTags(convertNumericFractions(
      convertUnicodePowerMarkers(
        convertSubscriptMarkers(
          convertCombinationMarkers(
            convertRootMarkers(convertFractions(convertTaggedPowers(normalized))),
          ),
        ),
      ),
    ))),
  ))));
}

function consolidateMathOption(value) {
  if (!value.includes("[[")) {
    return value;
  }

  const proseOutsideMarkers = value.replace(/\[\[[\s\S]*?\]\]/g, "");
  const proseWords = proseOutsideMarkers.match(/[A-Za-z]{2,}/g) ?? [];

  if (proseWords.length > 0) {
    return value;
  }

  return `[[${toLatex(value)}]]`;
}

function transform(value, stats, context = "") {
  if (typeof value === "string") {
    const migrated = convertMathString(value);
    const converted = context === "option" ? consolidateMathOption(migrated) : migrated;
    if (converted !== value) {
      stats.stringsChanged += 1;
    }
    return converted;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transform(item, stats, context));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        transform(item, stats, key === "options" ? "option" : key),
      ]),
    );
  }

  return value;
}

const source = JSON.parse(fs.readFileSync(lessonsPath, "utf8"));
const stats = { stringsChanged: 0 };
const converted = transform(source, stats);
const output = `${JSON.stringify(converted, null, 2)}\n`;

console.log(`Converted ${stats.stringsChanged} lesson strings to LaTeX notation.`);

if (shouldWrite) {
  fs.writeFileSync(lessonsPath, output);
  console.log(`Updated ${lessonsPath}`);
}
