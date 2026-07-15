import { type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml, {
  type MixedStyleDeclaration,
  type MixedStyleRecord,
} from "react-native-render-html";
import { MathJaxSvg } from "react-native-mathjax-html-to-svg";

interface Props {
  html: string;
  style?: StyleProp<TextStyle>;
}

/** Convert author-friendly [[LaTeX]] markers into MathJax inline delimiters. */
export function toMathJaxMarkup(value: string, boldMath = false) {
  const consolidatedValue = value.replace(/\]\]\s*\[\[/g, " ");

  return consolidatedValue.replace(
    /\[\[([\s\S]*?)\]\]([,.;:!?]?)/g,
    (_, latex: string, punctuation: string) => {
      // MathJax parses the complete string as an HTML document before it parses
      // TeX. A raw "<" can therefore be mistaken for an opening HTML tag and
      // truncate everything that follows. TeX relation commands avoid that
      // ambiguity while producing the same mathematical symbols.
      const expression = latex
        .trim()
        .replace(/</g, "\\lt ")
        .replace(/>/g, "\\gt ");
      const styledExpression = boldMath
        ? "\\boldsymbol{" + expression + "}"
        : expression;
      const suffix = punctuation ? "\\text{" + punctuation + "}" : "";

      // Keep adjacent punctuation inside the SVG so commas and full stops do
      // not wrap onto a new line by themselves.
      return "\\(" + styledExpression + suffix + "\\)";
    },
  );
}

function usesBoldWeight(fontWeight: TextStyle["fontWeight"]): boolean {
  if (fontWeight === "bold") return true;
  if (typeof fontWeight === "number") return fontWeight >= 600;
  if (typeof fontWeight === "string" && /^\d+$/.test(fontWeight)) {
    return Number(fontWeight) >= 600;
  }
  return false;
}

/**
 * Stops a line break between a base and its exponent.
 *
 * Example:
 * x<sup>3/2</sup>
 */
function keepPowersTogether(value: string): string {
  return value.replace(
    /([A-Za-z0-9)\]])\s*<sup\b/gi,
    "$1\u2060<sup"
  );
}

const tagsStyles: MixedStyleRecord = {
  sup: {
    fontSize: 10,
    lineHeight: 11,
    position: "relative",
    top: -5,
  },
};

const localStyles = StyleSheet.create({
  inlineMathRow: {
    maxWidth: "100%",
    alignSelf: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flexShrink: 1,
  },

  inlineText: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    width: "auto",
  },
  lineBreak: {
    width: "100%",
    height: 0,
  },

  paragraphBreak: {
    height: 8,
  },
  fraction: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
    marginVertical: 1,
  },

  fractionText: {
    paddingHorizontal: 3,
    paddingVertical: 0,
    textAlign: "center",
  },

  fractionNumerator: {
    marginBottom: -2,
    transform: [{ translateY: -1 }],
  },
  fractionDenominator: {
    marginTop: -5,
    paddingTop: 5,
  },

  fractionBar: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "#3a2e26",
  },
  superscript: {
    fontSize: 10,
    lineHeight: 11,
    position: "relative",
    top: -5,
  },
});

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&minus;/gi, "−")
    .replace(/&#8722;/gi, "−")
    .replace(/&amp;/gi, "&");
}

function removeOtherHtmlTags(value: string): string {
  return decodeHtmlEntities(
    value
      // Preserve spacing from feedback paragraphs.
      .replace(/<br\s*\/?>/gi, "\n")

      // Remove genuine HTML tags only.
      // This deliberately does not mistake "< 0" for a tag.
      .replace(/<\/?(?!sup\b)[a-z][^>]*>/gi, "")
  );
}

/**
 * Turns HTML containing <sup> into nested React Native Text.
 *
 * This keeps the base and exponent together and raises the
 * complete exponent, including fractional exponents such as 3/2.
 */
function renderInlineText(
  value: string,
  style: any,
  keyPrefix: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  const baseFontSize =
    typeof flattenedStyle.fontSize === "number"
      ? flattenedStyle.fontSize
      : 16;

  const superscriptFontSize = Math.max(
    10,
    Math.round(baseFontSize * 0.65)
  );

  const superscriptTop = -Math.max(
    5,
    Math.round(baseFontSize * 0.32)
  );
  const supPattern = /<sup\b[^>]*>([\s\S]*?)<\/sup>/gi;

  let previousIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = supPattern.exec(value)) !== null) {
    const textBefore = removeOtherHtmlTags(
      value.slice(previousIndex, match.index)
    );

    if (textBefore) {
      nodes.push(textBefore);
    }

    const exponent = removeOtherHtmlTags(match[1]);

    nodes.push(
      <Text
        key={`${keyPrefix}-sup-${index}`}
        style={[
          style,
          {
            fontSize: superscriptFontSize,
            lineHeight: superscriptFontSize + 1,
            position: "relative",
            top: superscriptTop,
          },
        ]}
      >
        {exponent}
      </Text>
    );

    previousIndex = supPattern.lastIndex;
    index += 1;
  }

  const remainingText = removeOtherHtmlTags(
    value.slice(previousIndex)
  );

  if (remainingText) {
    nodes.push(remainingText);
  }

  return nodes;
}

function renderTextWords(
  value: string,
  style: any,
  keyPrefix: string
): ReactNode[] {
  const nodes: ReactNode[] = [];

  const preparedValue = value
    .replace(
      /<br\s*\/?>\s*<br\s*\/?>/gi,
      "\n\n"
    )
    .replace(/<br\s*\/?>/gi, "\n");

  const sections = preparedValue.split(/(\n+)/);

  let textIndex = 0;
  let breakIndex = 0;

  sections.forEach((section) => {
    if (!section) {
      return;
    }

    if (/^\n+$/.test(section)) {
      nodes.push(
        <View
          key={`${keyPrefix}-break-${breakIndex}`}
          style={[
            localStyles.lineBreak,
            section.length > 1 &&
            localStyles.paragraphBreak,
          ]}
        />
      );

      breakIndex += 1;
      return;
    }

    const cleanedSection = removeOtherHtmlTags(section);
    const words = cleanedSection.match(/\S+\s*/g) ?? [];

    words.forEach((word) => {
      nodes.push(
        <Text
          key={`${keyPrefix}-word-${textIndex}`}
          style={[style, localStyles.inlineText]}
        >
          {renderInlineText(
            word,
            style,
            `${keyPrefix}-word-${textIndex}`
          )}
        </Text>
      );

      textIndex += 1;
    });
  });

  return nodes;
}
function renderFraction(
  numerator: string,
  denominator: string,
  style: any,
  key: string
): ReactNode {
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  const baseFontSize =
    typeof flattenedStyle.fontSize === "number"
      ? flattenedStyle.fontSize
      : 16;

  const fractionLineHeight = Math.max(
    12,
    Math.ceil(baseFontSize * 1.05)
  );

  return (
    <View key={key} style={localStyles.fraction}>
      <Text
        style={[
          style,
          localStyles.fractionText,
          {
            lineHeight: fractionLineHeight,
          },
          localStyles.fractionNumerator,
        ]}

      >
        {renderInlineText(
          numerator,
          style,
          `${key}-numerator`
        )}
      </Text>

      <View style={localStyles.fractionBar} />

      <Text
        style={[
          style,
          localStyles.fractionText,
          {
            lineHeight: fractionLineHeight,
          },
          localStyles.fractionDenominator,
        ]}

      >
        {renderInlineText(
          denominator,
          style,
          `${key}-denominator`
        )}
      </Text>
    </View>
  );
}
/**
 * Converts:
 *
 * <span class="math-frac">
 *   <span>1</span>
 *   <span>x<sup>n</sup></span>
 * </span>
 *
 * into a genuine stacked React Native fraction.
 */
function renderHtmlWithFractions(
  html: string,
  style: any
): ReactNode {
  const nodes: ReactNode[] = [];

  const fractionPattern =
    /<span\s+class=(?:"math-frac"|'math-frac')\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/gi;

  let previousIndex = 0;
  let match: RegExpExecArray | null;
  let fractionIndex = 0;

  while ((match = fractionPattern.exec(html)) !== null) {
    const textBeforeFraction = html.slice(
      previousIndex,
      match.index
    );

    nodes.push(
      ...renderTextWords(
        textBeforeFraction,
        style,
        `before-${fractionIndex}`
      )
    );

    nodes.push(
      renderFraction(
        match[1],
        match[2],
        style,
        `fraction-${fractionIndex}`
      )
    );

    previousIndex = fractionPattern.lastIndex;
    fractionIndex += 1;
  }

  const textAfterFinalFraction = html.slice(previousIndex);

  nodes.push(
    ...renderTextWords(
      textAfterFinalFraction,
      style,
      "after-final-fraction"
    )
  );

  return (
    <View style={localStyles.inlineMathRow}>
      {nodes}
    </View>
  );
}

export function PlainOrHtml({ html, style }: Props) {
  const { width } = useWindowDimensions();
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const hasLatex = /\[\[[\s\S]*?\]\]/.test(html);

  const preparedHtml = keepPowersTogether(html);

  if (hasLatex) {
    const fontSize =
      typeof flattenedStyle.fontSize === "number" ? flattenedStyle.fontSize : 16;
    const color =
      typeof flattenedStyle.color === "string" ? flattenedStyle.color : "#2D241F";

    return (
      <MathJaxSvg
        fontSize={fontSize}
        color={color}
        fontCache
        textStyle={flattenedStyle}
        style={{
          flex: typeof flattenedStyle.flex === "number" ? flattenedStyle.flex : undefined,
          marginTop: flattenedStyle.marginTop,
          marginBottom: flattenedStyle.marginBottom,
          marginLeft: flattenedStyle.marginLeft,
          marginRight: flattenedStyle.marginRight,
        }}
      >
        {toMathJaxMarkup(html, usesBoldWeight(flattenedStyle.fontWeight))}
      </MathJaxSvg>
    );
  }

  if (
    preparedHtml.includes("math-frac") ||
    /<sup\b/i.test(preparedHtml)
  ) {
    return renderHtmlWithFractions(preparedHtml, style);
  }

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(
    preparedHtml
  );

  if (!hasHtml) {
    return (
      <Text style={style}>
        {decodeHtmlEntities(preparedHtml)}
      </Text>
    );
  }

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: preparedHtml }}
      baseStyle={flattenedStyle as MixedStyleDeclaration}
      tagsStyles={tagsStyles}
    />
  );
}
