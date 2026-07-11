import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import type { MixedStyleDeclaration } from "react-native-render-html";
import { MathJaxSvg } from "react-native-mathjax-html-to-svg";

interface Props {
  html: string;
  style?: StyleProp<TextStyle>;
}

/** Convert author-friendly [[LaTeX]] markers into MathJax inline delimiters. */
export function toMathJaxMarkup(value: string) {
  return value.replace(/\[\[([\s\S]*?)\]\]/g, (_, latex: string) => {
    return `\\(${latex.trim()}\\)`;
  });
}

export function PlainOrHtml({ html, style }: Props) {
  const { width } = useWindowDimensions();
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const hasLatex = /\[\[[\s\S]*?\]\]/.test(html);

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(html);

  if (hasLatex) {
    const fontSize =
      typeof flattenedStyle.fontSize === "number"
        ? flattenedStyle.fontSize
        : 16;
    const color =
      typeof flattenedStyle.color === "string"
        ? flattenedStyle.color
        : "#2D241F";

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
        {toMathJaxMarkup(html)}
      </MathJaxSvg>
    );
  }

  if (!hasHtml) {
    return <Text style={style}>{html}</Text>;
  }

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html }}
      baseStyle={flattenedStyle as MixedStyleDeclaration}
    />
  );
}
