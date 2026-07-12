import { Text, useWindowDimensions } from "react-native";
import RenderHtml, {
  type MixedStyleRecord,
} from "react-native-render-html";

interface Props {
  html: string;
  style?: any;
}

/**
 * Stops a line break occurring between a base and its exponent.
 *
 * Example:
 * x<sup>3/2</sup>
 *
 * becomes:
 * x⁠<sup>3/2</sup>
 *
 * The invisible word-joiner keeps x and its exponent together.
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

    // Raise the whole exponent, including the normal "/" character.
    position: "relative",
    top: -2,
  },
};

export function PlainOrHtml({ html, style }: Props) {
  const { width } = useWindowDimensions();

  const preparedHtml = keepPowersTogether(html);
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(preparedHtml);

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