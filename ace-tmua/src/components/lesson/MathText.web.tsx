import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

interface Props {
  html: string;
  style?: StyleProp<TextStyle & ViewStyle>;
}

function formatMathHtml(source: string): string {
  let result = source;

  const fractionPattern =
    /<span\s+class=(["'])math-frac\1\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/i;

  /*
   * Convert each website-style fraction into a genuine stacked fraction.
   * Run repeatedly in case more than one fraction appears.
   */
  while (fractionPattern.test(result)) {
    result = result.replace(
      fractionPattern,
      (_match, _quote: string, numerator: string, denominator: string) => `
        <span style="
          display: inline-flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
          vertical-align: -0.38em;
          line-height: 1;
          margin: 0 0.14em;
          color: inherit;
        ">
          <span style="
            display: block;
            text-align: center;
            padding: 0 0.12em 0.08em;
            color: inherit;
          ">
            ${formatMathHtml(numerator)}
          </span>

          <span style="
            display: block;
            text-align: center;
            border-top: 1.2px solid currentColor;
            padding: 0.08em 0.12em 0;
            color: inherit;
          ">
            ${formatMathHtml(denominator)}
          </span>
        </span>
      `,
    );
  }

  /*
   * Convert a fractional exponent such as <sup>-3/2</sup>
   * into a stacked fraction contained inside a superscript.
   */
  result = result.replace(
    /<sup>\s*(-?[^/<]+?)\s*\/\s*([^<]+?)\s*<\/sup>/gi,
    (_match, numerator: string, denominator: string) => `
      <sup style="
        display: inline-flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        vertical-align: super;
        font-size: 0.67em;
        line-height: 0.82;
        margin-left: 0.03em;
        color: inherit;
      ">
        <span style="
          display: block;
          text-align: center;
          padding: 0 0.08em 0.04em;
          color: inherit;
        ">
          ${numerator.trim()}
        </span>

        <span style="
          display: block;
          text-align: center;
          border-top: 1px solid currentColor;
          padding: 0.04em 0.08em 0;
          color: inherit;
        ">
          ${denominator.trim()}
        </span>
      </sup>
    `,
  );

  result = result.replace(
    /<sup>([\s\S]*?)<\/sup>/gi,
    `<sup style="
      font-size: 0.7em;
      line-height: 0;
      vertical-align: super;
      color: inherit;
    ">$1</sup>`,
  );

  result = result.replace(
    /<sub>([\s\S]*?)<\/sub>/gi,
    `<sub style="
      font-size: 0.7em;
      line-height: 0;
      vertical-align: sub;
      color: inherit;
    ">$1</sub>`,
  );

  return result;
}

export function PlainOrHtml({ html, style }: Props) {
  const flattened = StyleSheet.flatten(style) ?? {};
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(html);

  if (!hasHtml) {
    return <Text style={style}>{html}</Text>;
  }

  const {
    flex,
    flexGrow,
    flexShrink,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    width,
    maxWidth,
    ...textProperties
  } = flattened;

  const outerStyle: ViewStyle = {
    flex,
    flexGrow,
    flexShrink,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    width,
    maxWidth,
  };

  const webStyle = {
    color: textProperties.color ?? "#2D241F",
    fontSize: textProperties.fontSize ?? 16,
    fontWeight: textProperties.fontWeight ?? "400",
    fontFamily: textProperties.fontFamily,
    fontStyle: textProperties.fontStyle,
    lineHeight:
      typeof textProperties.lineHeight === "number"
        ? `${textProperties.lineHeight}px`
        : "normal",
    letterSpacing: textProperties.letterSpacing,
    textAlign: textProperties.textAlign ?? "left",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <View style={[outerStyle, flex == null && { width: "100%" }]}>
      {React.createElement("div", {
        style: webStyle as any,
        dangerouslySetInnerHTML: {
          __html: formatMathHtml(html),
        },
      })}
    </View>
  );
}