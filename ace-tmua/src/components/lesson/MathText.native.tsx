import { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";
import Katex from "react-native-katex";

interface Props {
    html: string;
    style?: StyleProp<TextStyle & ViewStyle>;
}

type ContentSegment =
    | {
        type: "text";
        value: string;
    }
    | {
        type: "math";
        value: string;
    };

interface FoundMath {
    index: number;
    length: number;
    html: string;
    priority: number;
}

function decodeHtmlEntities(value: string): string {
    return value
        .replace(/&gt;/gi, ">")
        .replace(/&lt;/gi, "<")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, " ")
        .replace(/&times;/gi, "×")
        .replace(/&minus;/gi, "−")
        .replace(/&ne;/gi, "≠")
        .replace(/&#(\d+);/g, (_match, code: string) =>
            String.fromCharCode(Number(code)),
        );
}

function cleanText(value: string): string {
    return decodeHtmlEntities(
        value
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, ""),
    );
}

function plainMathToLatex(source: string): string {
    let value = decodeHtmlEntities(source);

    value = value.replace(
        /√\(([^()]*)\)/g,
        (_match, inside: string) =>
            `\\sqrt{${plainMathToLatex(inside)}}`,
    );

    value = value.replace(
        /√([A-Za-z0-9]+)/g,
        (_match, inside: string) => `\\sqrt{${inside}}`,
    );

    return value
        .replace(/×/g, "\\times ")
        .replace(/÷/g, "\\div ")
        .replace(/−/g, "-")
        .replace(/≠/g, "\\ne ")
        .replace(/≤/g, "\\le ")
        .replace(/≥/g, "\\ge ")
        .replace(/%/g, "\\%")
        .replace(/&/g, "\\&");
}

function exponentToLatex(source: string): string {
    const value = cleanText(source).trim();

    const fraction = value.match(
        /^(-?)\s*([^/]+?)\s*\/\s*([^/]+?)$/,
    );

    if (fraction) {
        const sign = fraction[1];

        return `${sign}\\frac{${plainMathToLatex(
            fraction[2],
        )}}{${plainMathToLatex(fraction[3])}}`;
    }

    return plainMathToLatex(value);
}

function htmlMathToLatex(source: string): string {
    let value = decodeHtmlEntities(source);

    const fractionPattern =
        /<span\s+class=(["'])math-frac\1\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/i;

    while (fractionPattern.test(value)) {
        value = value.replace(
            fractionPattern,
            (_match, _quote: string, numerator: string, denominator: string) =>
                `\\frac{${htmlMathToLatex(numerator)}}{${htmlMathToLatex(
                    denominator,
                )}}`,
        );
    }

    /*
     * A number, variable or bracketed expression immediately followed by
     * <sup> is converted into one complete KaTeX power.
     */
    value = value.replace(
        /(\([^<>]*\)|√?[A-Za-z0-9]+)<sup>([\s\S]*?)<\/sup>/gi,
        (_match, base: string, exponent: string) =>
            `${plainMathToLatex(base)}^{${exponentToLatex(exponent)}}`,
    );

    value = value.replace(
        /(\([^<>]*\)|√?[A-Za-z0-9]+)<sub>([\s\S]*?)<\/sub>/gi,
        (_match, base: string, subscript: string) =>
            `${plainMathToLatex(base)}_{${plainMathToLatex(
                cleanText(subscript),
            )}}`,
    );

    value = value.replace(
        /<sup>([\s\S]*?)<\/sup>/gi,
        (_match, exponent: string) =>
            `^{${exponentToLatex(exponent)}}`,
    );

    value = value.replace(
        /<sub>([\s\S]*?)<\/sub>/gi,
        (_match, subscript: string) =>
            `_{${plainMathToLatex(cleanText(subscript))}}`,
    );

    value = value.replace(/<[^>]+>/g, "");

    return plainMathToLatex(value);
}

function isMostlyMath(source: string): boolean {
    const text = cleanText(source).trim();

    if (!text) return false;

    const longWords = text.match(/[A-Za-z]{2,}/g) ?? [];

    return (
        longWords.length === 0 &&
        /[A-Za-z0-9√=+\-−×÷<>()[\]]/.test(text)
    );
}

function findNextMath(source: string): FoundMath | null {
    const results: FoundMath[] = [];

    const fraction =
        /<span\s+class=(["'])math-frac\1\s*>\s*<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>\s*<\/span>/i.exec(
            source,
        );

    if (fraction) {
        results.push({
            index: fraction.index,
            length: fraction[0].length,
            html: fraction[0],
            priority: 0,
        });
    }

    const power =
        /(\([^<>]*\)|√?[A-Za-z0-9]+)<sup>([\s\S]*?)<\/sup>/i.exec(
            source,
        );

    if (power) {
        results.push({
            index: power.index,
            length: power[0].length,
            html: power[0],
            priority: 1,
        });
    }

    const subscript =
        /(\([^<>]*\)|√?[A-Za-z0-9]+)<sub>([\s\S]*?)<\/sub>/i.exec(
            source,
        );

    if (subscript) {
        results.push({
            index: subscript.index,
            length: subscript[0].length,
            html: subscript[0],
            priority: 1,
        });
    }

    const standalonePower = /<sup>([\s\S]*?)<\/sup>/i.exec(source);

    if (standalonePower) {
        results.push({
            index: standalonePower.index,
            length: standalonePower[0].length,
            html: standalonePower[0],
            priority: 2,
        });
    }

    const standaloneSubscript = /<sub>([\s\S]*?)<\/sub>/i.exec(
        source,
    );

    if (standaloneSubscript) {
        results.push({
            index: standaloneSubscript.index,
            length: standaloneSubscript[0].length,
            html: standaloneSubscript[0],
            priority: 2,
        });
    }

    if (results.length === 0) return null;

    results.sort(
        (first, second) =>
            first.index - second.index ||
            first.priority - second.priority,
    );

    return results[0];
}

function addSegment(
    segments: ContentSegment[],
    nextSegment: ContentSegment,
) {
    if (!nextSegment.value) return;

    const previous = segments[segments.length - 1];

    if (previous && previous.type === nextSegment.type) {
        previous.value += nextSegment.value;
        return;
    }

    segments.push(nextSegment);
}

function splitContent(source: string): ContentSegment[] {
    if (isMostlyMath(source)) {
        return [
            {
                type: "math",
                value: htmlMathToLatex(source),
            },
        ];
    }

    const segments: ContentSegment[] = [];
    let remaining = source;

    while (remaining.length > 0) {
        const found = findNextMath(remaining);

        if (!found) {
            const plainValue = cleanText(remaining);

            addSegment(segments, {
                type: isMostlyMath(plainValue) ? "math" : "text",
                value: isMostlyMath(plainValue)
                    ? plainMathToLatex(plainValue)
                    : plainValue,
            });

            break;
        }

        if (found.index > 0) {
            const before = cleanText(
                remaining.slice(0, found.index),
            );

            addSegment(segments, {
                type: isMostlyMath(before) ? "math" : "text",
                value: isMostlyMath(before)
                    ? plainMathToLatex(before)
                    : before,
            });
        }

        addSegment(segments, {
            type: "math",
            value: htmlMathToLatex(found.html),
        });

        remaining = remaining.slice(
            found.index + found.length,
        );
    }

    return segments;
}

function estimateMathWidth(
    latex: string,
    fontSize: number,
    maximumWidth: number,
): number {
    const visibleCharacters = latex
        .replace(/\\frac/g, "")
        .replace(/\\sqrt/g, "√")
        .replace(/\\times/g, "×")
        .replace(/\\div/g, "÷")
        .replace(/\\[A-Za-z]+/g, "")
        .replace(/[{}]/g, "")
        .length;

    return Math.min(
        maximumWidth,
        Math.max(fontSize * 1.4, visibleCharacters * fontSize * 0.61 + 10),
    );
}

function MathFormula({
    latex,
    textStyle,
    fullWidth,
}: {
    latex: string;
    textStyle: TextStyle;
    fullWidth: boolean;
}) {
    const { width: screenWidth } = useWindowDimensions();

    const fontSize =
        typeof textStyle.fontSize === "number"
            ? textStyle.fontSize
            : 16;

    const lineHeight =
        typeof textStyle.lineHeight === "number"
            ? textStyle.lineHeight
            : fontSize * 1.4;

    const colour =
        typeof textStyle.color === "string"
            ? textStyle.color
            : "#2D241F";

    const fontWeight = String(
        textStyle.fontWeight ?? "400",
    );

    const containsTallMath =
        latex.includes("\\frac") || latex.includes("\\sqrt");

    const [height, setHeight] = useState(
        Math.ceil(
            containsTallMath
                ? fontSize * 2.15
                : lineHeight * 1.2,
        ),
    );

    const estimatedWidth = estimateMathWidth(
        latex,
        fontSize,
        Math.max(40, screenWidth - 64),
    );

    const inlineStyle = `
    html, body {
      background: transparent;
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
    }

    body {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .katex {
      color: ${colour};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: 1.2;
      margin: 0;
      white-space: nowrap;
    }

    .katex-display {
      margin: 0;
      text-align: left;
    }
  `;

    const heightScript = `
    (function () {
      function sendHeight() {
        var body = document.body;
        var root = document.documentElement;

        var measuredHeight = Math.ceil(Math.max(
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0,
          root ? root.scrollHeight : 0,
          root ? root.offsetHeight : 0
        ));

        if (measuredHeight > 0) {
          window.ReactNativeWebView.postMessage(
            String(measuredHeight)
          );
        }
      }

      setTimeout(sendHeight, 0);
      setTimeout(sendHeight, 80);
      setTimeout(sendHeight, 250);

      if (window.ResizeObserver && document.body) {
        new ResizeObserver(sendHeight).observe(document.body);
      }

      true;
    })();
  `;

    return (
        <View
            pointerEvents="none"
            style={{
                width: fullWidth ? "100%" : estimatedWidth,
                height,
                flexShrink: fullWidth ? 1 : 0,
            }}
        >
            <Katex
                expression={latex}
                displayMode={false}
                throwOnError={false}
                errorColor="#CC0000"
                colorIsTextColor
                inlineStyle={inlineStyle}
                injectedJavaScript={heightScript}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                originWhitelist={["*"]}
                containerStyle={{
                    backgroundColor: "transparent",
                }}
                style={{
                    width: "100%",
                    height,
                    backgroundColor: "transparent",
                }}
                onMessage={(event) => {
                    const nextHeight = Number(
                        event.nativeEvent.data,
                    );

                    if (
                        Number.isFinite(nextHeight) &&
                        nextHeight > 0
                    ) {
                        const safeHeight = Math.max(
                            18,
                            Math.min(120, Math.ceil(nextHeight)),
                        );

                        setHeight((currentHeight) =>
                            Math.abs(currentHeight - safeHeight) > 1
                                ? safeHeight
                                : currentHeight,
                        );
                    }
                }}
            />
        </View>
    );
}

function NativeTextPieces({
    value,
    textStyle,
}: {
    value: string;
    textStyle: TextStyle;
}) {
    const pieces = value
        .split(/(\s+)/)
        .filter((piece) => piece.length > 0);

    return (
        <>
            {pieces.map((piece, index) => (
                <Text
                    key={`${piece}-${index}`}
                    style={textStyle}
                >
                    {piece}
                </Text>
            ))}
        </>
    );
}

export function PlainOrHtml({ html, style }: Props) {
    const flattened = StyleSheet.flatten(style) ?? {};
    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(html);

    if (!containsHtml) {
        return <Text style={style}>{html}</Text>;
    }

    const fontSize =
        typeof flattened.fontSize === "number"
            ? flattened.fontSize
            : 16;

    const textStyle: TextStyle = {
        color: flattened.color ?? "#2D241F",
        fontSize,
        fontWeight: flattened.fontWeight,
        fontStyle: flattened.fontStyle,
        fontFamily: flattened.fontFamily,
        lineHeight:
            typeof flattened.lineHeight === "number"
                ? flattened.lineHeight
                : fontSize * 1.4,
        letterSpacing: flattened.letterSpacing,
        textAlign: flattened.textAlign,
        textDecorationLine:
            flattened.textDecorationLine,
    };

    const outerStyle: ViewStyle = {
        flex: flattened.flex,
        flexGrow: flattened.flexGrow,
        flexShrink: flattened.flexShrink,
        marginTop: flattened.marginTop,
        marginBottom: flattened.marginBottom,
        marginLeft: flattened.marginLeft,
        marginRight: flattened.marginRight,
        marginHorizontal: flattened.marginHorizontal,
        marginVertical: flattened.marginVertical,
        width: flattened.width,
        maxWidth: flattened.maxWidth,
    };

    const segments = splitContent(html);
    const isSingleFormula =
        segments.length === 1 &&
        segments[0].type === "math";

    if (isSingleFormula) {
        return (
            <View
                style={[
                    outerStyle,
                    flattened.flex == null && {
                        width: "100%",
                    },
                ]}
            >
                <MathFormula
                    latex={segments[0].value}
                    textStyle={textStyle}
                    fullWidth
                />
            </View>
        );
    }

    return (
        <View style={[styles.flow, outerStyle]}>
            {segments.map((segment, index) =>
                segment.type === "math" ? (
                    <MathFormula
                        key={`math-${index}`}
                        latex={segment.value}
                        textStyle={textStyle}
                        fullWidth={false}
                    />
                ) : (
                    <NativeTextPieces
                        key={`text-${index}`}
                        value={segment.value}
                        textStyle={textStyle}
                    />
                ),
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    flow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        width: "100%",
    },
});