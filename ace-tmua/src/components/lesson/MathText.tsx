import { Text, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

interface Props {
  html: string;
  style?: any;
}

export function PlainOrHtml({ html, style }: Props) {
  const { width } = useWindowDimensions();

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(html);

  if (!hasHtml) {
    return <Text style={style}>{html}</Text>;
  }

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html }}
      baseStyle={style}
    />
  );
}