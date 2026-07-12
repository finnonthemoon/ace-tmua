import { type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml, {
  type MixedStyleRecord,
} from "react-native-render-html";

interface Props {
  html: string;
  style?: any;
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
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  inlineText: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    width: "auto",
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
    paddingVertical: 1,
    textAlign: "center",
  },
  fractionNumerator: {
    transform: [{ translateY: 2 }],
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
    value.replace(/<(?!\/?sup\b)[^>]*>/gi, "")
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
  if (!value) {
    return [];
  }

  return [
    <Text
      key={`${keyPrefix}-text`}
      style={[style, localStyles.inlineText]}
    >
      {renderInlineText(
        value,
        style,
        `${keyPrefix}-text`
      )}
    </Text>,
  ];
}

function renderFraction(
  numerator: string,
  denominator: string,
  style: any,
  key: string
): ReactNode {
  return (
    <View key={key} style={localStyles.fraction}>
      <Text
        style={[
          style,
          localStyles.fractionText,
          localStyles.fractionNumerator,
        ]}
        numberOfLines={1}
      >
        {renderInlineText(
          numerator,
          style,
          `${key}-numerator`
        )}
      </Text>

      <View style={localStyles.fractionBar} />

      <Text
        style={[style, localStyles.fractionText]}
        numberOfLines={1}
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

  const preparedHtml = keepPowersTogether(html);

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
    return <Text style={style}>{preparedHtml}</Text>;
  }

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: preparedHtml }}
      baseStyle={style}
      tagsStyles={tagsStyles}
    />
  );
}