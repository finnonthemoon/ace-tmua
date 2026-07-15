import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { C } from "./shared";
import type { LessonDiagram } from "./types";

interface Props {
  diagram: LessonDiagram;
}

const trapeziumPoints = [
  { x: 38, y: 136 },
  { x: 86, y: 112 },
  { x: 134, y: 76 },
  { x: 182, y: 52 },
  { x: 230, y: 67 },
  { x: 278, y: 104 },
];

function Axes({ xAxisY = 150, yAxisX = 34 }: { xAxisY?: number; yAxisX?: number }) {
  return (
    <>
      <Line x1={18} y1={xAxisY} x2={304} y2={xAxisY} stroke="#9D8E82" strokeWidth={1.5} />
      <Polygon
        points={"304," + xAxisY + " 296," + (xAxisY - 4) + " 296," + (xAxisY + 4)}
        fill="#9D8E82"
      />
      <Line x1={yAxisX} y1={170} x2={yAxisX} y2={16} stroke="#9D8E82" strokeWidth={1.5} />
      <Polygon
        points={yAxisX + ",16 " + (yAxisX - 4) + ",24 " + (yAxisX + 4) + ",24"}
        fill="#9D8E82"
      />
      <SvgText x={295} y={xAxisY - 8} fontSize={12} fontWeight="700" fill={C.muted}>
        x
      </SvgText>
      <SvgText x={yAxisX + 8} y={24} fontSize={12} fontWeight="700" fill={C.muted}>
        y
      </SvgText>
    </>
  );
}

function TangentGradientDiagram() {
  return (
    <>
      <Axes />
      <Path
        d="M 22 158 C 68 153, 96 119, 138 92 C 180 65, 225 72, 298 31"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Line
        x1={69}
        y1={137}
        x2={263}
        y2={42}
        stroke={C.ink}
        strokeWidth={2.5}
        strokeDasharray="7 5"
      />
      <Circle cx={151} cy={97} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <SvgText x={159} y={90} fontSize={12} fontWeight="800" fill={C.ink}>
        P
      </SvgText>
      <SvgText x={224} y={57} fontSize={11} fontWeight="700" fill={C.muted}>
        tangent
      </SvgText>
    </>
  );
}

function TurningPointsDiagram() {
  return (
    <>
      <Axes xAxisY={154} />
      <Path
        d="M 24 139 C 63 153, 75 49, 127 55 C 184 61, 175 157, 229 149 C 265 144, 274 94, 299 61"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle cx={112} cy={54} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={219} cy={150} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <Line x1={92} y1={54} x2={132} y2={54} stroke={C.ink} strokeWidth={2} strokeDasharray="4 4" />
      <Line x1={199} y1={150} x2={239} y2={150} stroke={C.ink} strokeWidth={2} strokeDasharray="4 4" />
      <SvgText x={75} y={39} fontSize={11} fontWeight="800" fill={C.ink}>
        maximum
      </SvgText>
      <SvgText x={201} y={137} fontSize={11} fontWeight="800" fill={C.ink}>
        minimum
      </SvgText>
    </>
  );
}

function SignedAreaDiagram() {
  return (
    <>
      <Axes xAxisY={101} />
      <Path
        d="M 50 101 C 77 56, 111 52, 150 101 L 50 101 Z"
        fill="#FFD6A8"
        opacity={0.9}
      />
      <Path
        d="M 150 101 C 190 146, 230 149, 270 101 L 150 101 Z"
        fill="#DDE7F8"
        opacity={0.95}
      />
      <Path
        d="M 22 133 C 69 48, 111 50, 150 101 C 192 151, 231 148, 298 54"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle cx={150} cy={101} r={3.5} fill={C.ink} />
      <Circle cx={270} cy={101} r={3.5} fill={C.ink} />
      <SvgText x={91} y={83} fontSize={13} fontWeight="900" fill={C.primary}>
        +A
      </SvgText>
      <SvgText x={202} y={126} fontSize={13} fontWeight="900" fill="#54749F">
        −B
      </SvgText>
    </>
  );
}

function TrapeziumRuleDiagram() {
  return (
    <>
      <Axes xAxisY={158} />
      {trapeziumPoints.slice(0, -1).map((point, index) => {
        const next = trapeziumPoints[index + 1];
        return (
          <Polygon
            key={point.x}
            points={
              point.x + ",158 " +
              point.x + "," + point.y + " " +
              next.x + "," + next.y + " " +
              next.x + ",158"
            }
            fill={index % 2 === 0 ? "#FFE3BE" : "#FFF0D9"}
            stroke="#F4B25F"
            strokeWidth={1}
          />
        );
      })}
      {trapeziumPoints.map((point) => (
        <Line
          key={"line-" + point.x}
          x1={point.x}
          y1={158}
          x2={point.x}
          y2={point.y}
          stroke="#C88A43"
          strokeWidth={1.4}
        />
      ))}
      <Path
        d="M 24 143 C 73 128, 104 94, 134 76 C 171 53, 196 51, 230 67 C 253 78, 270 96, 298 116"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {trapeziumPoints.map((point) => (
        <Circle key={"point-" + point.x} cx={point.x} cy={point.y} r={3.5} fill={C.primary} />
      ))}
      <Line x1={38} y1={170} x2={86} y2={170} stroke={C.ink} strokeWidth={1.2} />
      <Line x1={38} y1={166} x2={38} y2={174} stroke={C.ink} strokeWidth={1.2} />
      <Line x1={86} y1={166} x2={86} y2={174} stroke={C.ink} strokeWidth={1.2} />
      <SvgText x={59} y={181} fontSize={11} fontWeight="800" fill={C.ink}>
        h
      </SvgText>
    </>
  );
}

function GraphTransformationsDiagram() {
  return (
    <>
      <Axes xAxisY={158} yAxisX={42} />
      <Path
        d="M 48 145 Q 105 28 162 145"
        fill="none"
        stroke="#A99C92"
        strokeWidth={3}
        strokeDasharray="6 5"
      />
      <Path
        d="M 111 124 Q 172 8 233 124"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <SvgText x={55} y={112} fontSize={11} fontWeight="800" fill="#8E8178">
        y = f(x)
      </SvgText>
      <SvgText x={195} y={42} fontSize={11} fontWeight="800" fill={C.primary}>
        transformed
      </SvgText>
      <Line x1={104} y1={145} x2={172} y2={124} stroke={C.ink} strokeWidth={1.5} />
      <Polygon points="172,124 163,123 166,131" fill={C.ink} />
    </>
  );
}

function FunctionIntersectionsDiagram() {
  return (
    <>
      <Axes xAxisY={154} />
      <Path
        d="M 43 46 Q 154 203 286 43"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Line x1={43} y1={137} x2={287} y2={42} stroke="#54749F" strokeWidth={3} />
      <Circle cx={89} cy={119} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={239} cy={61} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <SvgText x={52} y={73} fontSize={11} fontWeight="800" fill={C.primary}>
        y = f(x)
      </SvgText>
      <SvgText x={244} y={82} fontSize={11} fontWeight="800" fill="#54749F">
        y = g(x)
      </SvgText>
    </>
  );
}

function SimilarityScaleDiagram() {
  return (
    <>
      <Polygon
        points="35,145 35,65 95,145"
        fill="#FFF0D9"
        stroke={C.primary}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Polygon
        points="155,155 155,35 275,155"
        fill="#E9F3FD"
        stroke="#54749F"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Rect x={35} y={133} width={12} height={12} fill="none" stroke={C.muted} strokeWidth={1.5} />
      <Rect x={155} y={143} width={12} height={12} fill="none" stroke={C.muted} strokeWidth={1.5} />
      <SvgText x={21} y={108} fontSize={12} fontWeight="800" fill={C.ink}>3</SvgText>
      <SvgText x={60} y={160} fontSize={12} fontWeight="800" fill={C.ink}>4</SvgText>
      <SvgText x={68} y={101} fontSize={12} fontWeight="800" fill={C.ink}>5</SvgText>
      <SvgText x={137} y={103} fontSize={12} fontWeight="800" fill={C.ink}>6</SvgText>
      <SvgText x={211} y={172} fontSize={12} fontWeight="800" fill={C.ink}>8</SvgText>
      <SvgText x={220} y={92} fontSize={12} fontWeight="800" fill={C.ink}>10</SvgText>
      <SvgText x={105} y={31} fontSize={12} fontWeight="900" fill={C.primary}>
        scale factor 2
      </SvgText>
    </>
  );
}

function CircleTheoremsDiagram() {
  return (
    <>
      <Circle cx={148} cy={96} r={66} fill="#FFF8ED" stroke={C.primary} strokeWidth={3} />
      <Circle cx={148} cy={96} r={4} fill={C.ink} />
      <Line x1={148} y1={96} x2={214} y2={96} stroke={C.ink} strokeWidth={2} />
      <Line x1={214} y1={20} x2={214} y2={172} stroke="#54749F" strokeWidth={3} />
      <Rect x={202} y={96} width={12} height={12} fill="none" stroke={C.muted} strokeWidth={1.5} />
      <Line x1={96} y1={137} x2={196} y2={56} stroke="#C88A43" strokeWidth={2.5} />
      <Circle cx={96} cy={137} r={3.5} fill={C.ink} />
      <Circle cx={196} cy={56} r={3.5} fill={C.ink} />
      <SvgText x={132} y={88} fontSize={11} fontWeight="800" fill={C.ink}>centre</SvgText>
      <SvgText x={221} y={45} fontSize={11} fontWeight="800" fill="#54749F">tangent</SvgText>
      <SvgText x={180} y={91} fontSize={11} fontWeight="900" fill={C.primary}>90°</SvgText>
      <SvgText x={125} y={133} fontSize={11} fontWeight="800" fill="#A66F2E">chord</SvgText>
    </>
  );
}

function HistogramDensityDiagram() {
  return (
    <>
      <Axes xAxisY={158} yAxisX={38} />
      <Rect x={50} y={118} width={40} height={40} fill="#FFE3BE" stroke={C.primary} strokeWidth={2} />
      <Rect x={90} y={78} width={60} height={80} fill="#FFD09B" stroke={C.primary} strokeWidth={2} />
      <Rect x={150} y={103} width={80} height={55} fill="#FFE3BE" stroke={C.primary} strokeWidth={2} />
      <Rect x={230} y={58} width={50} height={100} fill="#FFD09B" stroke={C.primary} strokeWidth={2} />
      <SvgText x={70} y={176} fontSize={10} fontWeight="700" fill={C.muted}>10</SvgText>
      <SvgText x={133} y={176} fontSize={10} fontWeight="700" fill={C.muted}>25</SvgText>
      <SvgText x={213} y={176} fontSize={10} fontWeight="700" fill={C.muted}>45</SvgText>
      <SvgText x={265} y={176} fontSize={10} fontWeight="700" fill={C.muted}>55</SvgText>
      <SvgText x={48} y={24} fontSize={10} fontWeight="800" fill={C.ink}>frequency density</SvgText>
    </>
  );
}

function CumulativeFrequencyDiagram() {
  return (
    <>
      <Axes xAxisY={158} yAxisX={38} />
      <Path
        d="M 40 157 C 72 154, 84 145, 105 132 C 134 114, 145 91, 172 74 C 205 53, 236 47, 286 36"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Line x1={38} y1={96} x2={159} y2={96} stroke="#54749F" strokeWidth={1.5} strokeDasharray="5 4" />
      <Line x1={159} y1={96} x2={159} y2={158} stroke="#54749F" strokeWidth={1.5} strokeDasharray="5 4" />
      <Circle cx={159} cy={96} r={4} fill="#54749F" />
      <SvgText x={44} y={91} fontSize={10} fontWeight="800" fill="#54749F">median position</SvgText>
      <SvgText x={139} y={175} fontSize={10} fontWeight="800" fill="#54749F">median</SvgText>
    </>
  );
}

const scatterPoints = [
  [56, 139], [77, 126], [91, 132], [111, 108], [129, 113],
  [145, 90], [168, 99], [184, 73], [207, 78], [226, 55],
  [249, 63], [270, 39],
];

function ScatterCorrelationDiagram() {
  return (
    <>
      <Axes xAxisY={158} yAxisX={38} />
      <Line x1={48} y1={143} x2={283} y2={35} stroke="#54749F" strokeWidth={2.5} strokeDasharray="7 5" />
      {scatterPoints.map(([x, y]) => (
        <Circle key={x + "-" + y} cx={x} cy={y} r={4.5} fill={C.primary} opacity={0.9} />
      ))}
      <SvgText x={188} y={125} fontSize={11} fontWeight="800" fill="#54749F">
        line of best fit
      </SvgText>
    </>
  );
}

function ProbabilityTreeDiagram() {
  return (
    <>
      <Circle cx={35} cy={95} r={4} fill={C.ink} />
      <Line x1={39} y1={93} x2={125} y2={45} stroke={C.primary} strokeWidth={3} />
      <Line x1={39} y1={97} x2={125} y2={145} stroke={C.primary} strokeWidth={3} />
      <Line x1={129} y1={43} x2={226} y2={24} stroke="#54749F" strokeWidth={2.5} />
      <Line x1={129} y1={47} x2={226} y2={72} stroke="#54749F" strokeWidth={2.5} />
      <Line x1={129} y1={143} x2={226} y2={120} stroke="#54749F" strokeWidth={2.5} />
      <Line x1={129} y1={147} x2={226} y2={166} stroke="#54749F" strokeWidth={2.5} />
      <Circle cx={127} cy={45} r={4} fill={C.ink} />
      <Circle cx={127} cy={145} r={4} fill={C.ink} />
      <SvgText x={77} y={58} fontSize={11} fontWeight="800" fill={C.primary}>A</SvgText>
      <SvgText x={70} y={138} fontSize={11} fontWeight="800" fill={C.primary}>not A</SvgText>
      <SvgText x={173} y={28} fontSize={11} fontWeight="800" fill="#54749F">B</SvgText>
      <SvgText x={170} y={72} fontSize={11} fontWeight="800" fill="#54749F">not B</SvgText>
      <SvgText x={173} y={119} fontSize={11} fontWeight="800" fill="#54749F">B</SvgText>
      <SvgText x={170} y={166} fontSize={11} fontWeight="800" fill="#54749F">not B</SvgText>
      <SvgText x={232} y={28} fontSize={10} fontWeight="700" fill={C.ink}>A and B</SvgText>
      <SvgText x={232} y={76} fontSize={10} fontWeight="700" fill={C.ink}>A only</SvgText>
    </>
  );
}

export default function LessonDiagramView({ diagram }: Props) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="image"
      accessibilityLabel={diagram.caption || "Lesson diagram"}
    >
      <Svg width="100%" height={190} viewBox="0 0 320 190">
        {diagram.kind === "tangent-gradient" && <TangentGradientDiagram />}
        {diagram.kind === "turning-points" && <TurningPointsDiagram />}
        {diagram.kind === "signed-area" && <SignedAreaDiagram />}
        {diagram.kind === "trapezium-rule" && <TrapeziumRuleDiagram />}
        {diagram.kind === "graph-transformations" && <GraphTransformationsDiagram />}
        {diagram.kind === "function-intersections" && <FunctionIntersectionsDiagram />}
        {diagram.kind === "similarity-scale" && <SimilarityScaleDiagram />}
        {diagram.kind === "circle-theorems" && <CircleTheoremsDiagram />}
        {diagram.kind === "histogram-density" && <HistogramDensityDiagram />}
        {diagram.kind === "cumulative-frequency" && <CumulativeFrequencyDiagram />}
        {diagram.kind === "scatter-correlation" && <ScatterCorrelationDiagram />}
        {diagram.kind === "probability-tree" && <ProbabilityTreeDiagram />}
      </Svg>
      {diagram.caption && <Text style={styles.caption}>{diagram.caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginTop: 8,
    marginBottom: 18,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    overflow: "hidden",
  },
  caption: {
    paddingHorizontal: 8,
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
});
