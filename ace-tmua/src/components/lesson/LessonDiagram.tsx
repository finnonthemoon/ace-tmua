import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  G,
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

      {/* Tangent passes exactly through P at (138, 92). */}
      <Line
        x1={68}
        y1={137}
        x2={250}
        y2={20}
        stroke={C.ink}
        strokeWidth={2.5}
        strokeDasharray="7 5"
      />

      {/* P is exactly on both the curve and tangent. */}
      <Circle
        cx={138}
        cy={92}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      <SvgText
        x={147}
        y={86}
        fontSize={12}
        fontWeight="800"
        fill={C.ink}
      >
        P
      </SvgText>

      {/* Positioned above the tangent so the line does not cross the text. */}
      <SvgText
        x={190}
        y={36}
        fontSize={11}
        fontWeight="700"
        fill={C.muted}
      >
        tangent
      </SvgText>
    </>
  );
}
function TurningPointsDiagram() {
  return (
    <>
      <Axes xAxisY={154} />

      {/*
        The Bézier control points have matching y-values at the
        maximum and minimum, making both tangents horizontal.
      */}
      <Path
        d="M 24 139
           C 57 154, 78 54, 126 54
           C 171 54, 181 150, 224 150
           C 260 150, 274 93, 299 61"
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />

      {/* Maximum */}
      <Circle
        cx={126}
        cy={54}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      <Line
        x1={104}
        y1={54}
        x2={148}
        y2={54}
        stroke={C.ink}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      <SvgText
        x={91}
        y={39}
        fontSize={11}
        fontWeight="800"
        fill={C.ink}
      >
        maximum
      </SvgText>

      {/* Minimum */}
      <Circle
        cx={224}
        cy={150}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      <Line
        x1={202}
        y1={150}
        x2={246}
        y2={150}
        stroke={C.ink}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      <SvgText
        x={201}
        y={137}
        fontSize={11}
        fontWeight="800"
        fill={C.ink}
      >
        minimum
      </SvgText>
    </>
  );
}
function CubicStationaryPointsDiagram() {
  const graphLeft = 42;
  const graphRight = 304;
  const graphTop = 18;
  const graphBottom = 164;

  const xMin = -3;
  const xMax = 5;
  const yMin = -25;
  const yMax = 15;

  const f = (x: number) =>
    x ** 3 - 3 * x ** 2 - 9 * x + 5;

  const xToSvg = (x: number) =>
    graphLeft +
    ((x - xMin) / (xMax - xMin)) *
    (graphRight - graphLeft);

  const yToSvg = (y: number) =>
    graphTop +
    ((yMax - y) / (yMax - yMin)) *
    (graphBottom - graphTop);

  const sampleCount = 120;

  const curvePath = Array.from(
    { length: sampleCount + 1 },
    (_, index) => {
      const x =
        xMin + (index / sampleCount) * (xMax - xMin);

      const svgX = xToSvg(x);
      const svgY = yToSvg(f(x));

      return `${index === 0 ? "M" : "L"} ${svgX} ${svgY}`;
    }
  ).join(" ");

  const xAxisY = yToSvg(0);
  const yAxisX = xToSvg(0);

  const maximum = {
    x: xToSvg(-1),
    y: yToSvg(10),
  };

  const minimum = {
    x: xToSvg(3),
    y: yToSvg(-22),
  };

  return (
    <>
      <Axes xAxisY={xAxisY} yAxisX={yAxisX} />

      {/* Actual graph of f(x) = x³ - 3x² - 9x + 5 */}
      <Path
        d={curvePath}
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vertical guides to the stationary x-values */}
      <Line
        x1={maximum.x}
        y1={maximum.y}
        x2={maximum.x}
        y2={xAxisY}
        stroke="#54749F"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />

      <Line
        x1={minimum.x}
        y1={xAxisY}
        x2={minimum.x}
        y2={minimum.y}
        stroke="#54749F"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />

      {/* Horizontal tangents */}
      <Line
        x1={maximum.x - 20}
        y1={maximum.y}
        x2={maximum.x + 20}
        y2={maximum.y}
        stroke={C.ink}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      <Line
        x1={minimum.x - 20}
        y1={minimum.y}
        x2={minimum.x + 20}
        y2={minimum.y}
        stroke={C.ink}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      {/* Stationary points */}
      <Circle
        cx={maximum.x}
        cy={maximum.y}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      <Circle
        cx={minimum.x}
        cy={minimum.y}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Point labels */}
      <SvgText
        x={maximum.x}
        y={maximum.y - 13}
        textAnchor="middle"
        fontSize={11}
        fontWeight="800"
        fill={C.ink}
      >
        maximum
      </SvgText>

      <SvgText
        x={minimum.x}
        y={minimum.y - 12}
        textAnchor="middle"
        fontSize={11}
        fontWeight="800"
        fill={C.ink}
      >
        minimum
      </SvgText>

      {/* Stationary x-values */}
      <SvgText
        x={maximum.x}
        y={xAxisY + 17}
        textAnchor="middle"
        fontSize={10}
        fontWeight="800"
        fill="#54749F"
      >
        −1
      </SvgText>

      <SvgText
        x={minimum.x}
        y={xAxisY + 17}
        textAnchor="middle"
        fontSize={10}
        fontWeight="800"
        fill="#54749F"
      >
        3
      </SvgText>
    </>
  );
}
function SignedAreaDiagram() {
  const axisY = 101;

  const firstRoot = 56;
  const middleRoot = 150;
  const secondRoot = 274;

  return (
    <>
      <Axes xAxisY={axisY} />

      {/* Positive signed area */}
      <Path
        d={`
          M ${firstRoot} ${axisY}
          C 66 92, 108 58, ${middleRoot} ${axisY}
          L ${firstRoot} ${axisY}
          Z
        `}
        fill="#FFD6A8"
        opacity={0.92}
      />

      {/* Negative signed area */}
      <Path
        d={`
          M ${middleRoot} ${axisY}
          C 186 145, 228 149, ${secondRoot} ${axisY}
          L ${middleRoot} ${axisY}
          Z
        `}
        fill="#DDE7F8"
        opacity={0.96}
      />

      {/* Main curve with smooth join at the first x-intercept */}
      <Path
        d={`
          M 24 132
          C 34 120, 46 110, ${firstRoot} ${axisY}
          C 66 92, 108 58, ${middleRoot} ${axisY}
          C 186 145, 228 149, ${secondRoot} ${axisY}
          C 284 92, 292 76, 300 62
        `}
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* x-axis intercept markers */}
      <Circle cx={firstRoot} cy={axisY} r={3.5} fill={C.ink} />
      <Circle cx={middleRoot} cy={axisY} r={3.5} fill={C.ink} />
      <Circle cx={secondRoot} cy={axisY} r={3.5} fill={C.ink} />

      <SvgText x={100} y={97} fontSize={13} fontWeight="900" fill={C.primary}>
        +A
      </SvgText>
      <SvgText x={214} y={126} fontSize={13} fontWeight="900" fill="#54749F">
        −B
      </SvgText>
    </>
  );
}

function TrapeziumRuleDiagram() {
  const axisY = 146;
  const yAxisX = 40;

  // Ordinated points used both for the trapezia and for the smooth curve.
  const p0 = { x: 40, y: 128 };
  const p1 = { x: 90, y: 92 };
  const p2 = { x: 140, y: 64 };
  const p3 = { x: 190, y: 78 };
  const p4 = { x: 240, y: 108 };

  // Extra curve continuation points, just for the smooth orange graph.
  const leftStart = { x: 18, y: 138 };
  const rightEnd = { x: 286, y: 136 };

  return (
    <>
      <Axes xAxisY={axisY} yAxisX={yAxisX} />

      {/* Shaded trapezia start exactly at x = 0 (the y-axis). */}
      <Path
        d={`
          M ${p0.x} ${axisY}
          L ${p0.x} ${p0.y}
          L ${p1.x} ${p1.y}
          L ${p2.x} ${p2.y}
          L ${p3.x} ${p3.y}
          L ${p4.x} ${p4.y}
          L ${p4.x} ${axisY}
          Z
        `}
        fill="#F4D7AE"
        opacity={0.95}
      />

      {/* Vertical trapezium boundaries */}
      <Line x1={p0.x} y1={axisY} x2={p0.x} y2={p0.y} stroke="#D89C4A" strokeWidth={1.6} />
      <Line x1={p1.x} y1={axisY} x2={p1.x} y2={p1.y} stroke="#D89C4A" strokeWidth={1.6} />
      <Line x1={p2.x} y1={axisY} x2={p2.x} y2={p2.y} stroke="#D89C4A" strokeWidth={1.6} />
      <Line x1={p3.x} y1={axisY} x2={p3.x} y2={p3.y} stroke="#D89C4A" strokeWidth={1.6} />
      <Line x1={p4.x} y1={axisY} x2={p4.x} y2={p4.y} stroke="#D89C4A" strokeWidth={1.6} />

      {/* Straight chord tops of the trapezia */}
      <Path
        d={`
          M ${p0.x} ${p0.y}
          L ${p1.x} ${p1.y}
          L ${p2.x} ${p2.y}
          L ${p3.x} ${p3.y}
          L ${p4.x} ${p4.y}
        `}
        fill="none"
        stroke="#D89C4A"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Smooth orange curve passing exactly through every orange dot */}
      <Path
        d={`
          M ${leftStart.x} ${leftStart.y}
          Q 28 134, ${p0.x} ${p0.y}
          Q 64 118, ${p1.x} ${p1.y}
          Q 114 70, ${p2.x} ${p2.y}
          Q 166 58, ${p3.x} ${p3.y}
          Q 216 92, ${p4.x} ${p4.y}
          Q 264 122, ${rightEnd.x} ${rightEnd.y}
        `}
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orange ordinate points, all exactly on the curve */}
      <Circle cx={p0.x} cy={p0.y} r={3.6} fill={C.primary} />
      <Circle cx={p1.x} cy={p1.y} r={3.6} fill={C.primary} />
      <Circle cx={p2.x} cy={p2.y} r={4.2} fill={C.primary} />
      <Circle cx={p3.x} cy={p3.y} r={3.6} fill={C.primary} />
      <Circle cx={p4.x} cy={p4.y} r={3.6} fill={C.primary} />

      {/* h marker under the first strip */}
      <Line x1={p0.x} y1={163} x2={p1.x} y2={163} stroke={C.ink} strokeWidth={1.5} />
      <Line x1={p0.x} y1={158} x2={p0.x} y2={168} stroke={C.ink} strokeWidth={1.5} />
      <Line x1={p1.x} y1={158} x2={p1.x} y2={168} stroke={C.ink} strokeWidth={1.5} />
      <SvgText x={63} y={177} fontSize={11} fontWeight="700" fill={C.ink}>
        h
      </SvgText>
    </>
  );
}

function MiniAxes({
  left,
  top,
  width,
  height,
  xAxisFraction = 0.5,
  yAxisFraction = 0.5,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  xAxisFraction?: number;
  yAxisFraction?: number;
}) {
  const xAxisY = top + height * xAxisFraction;
  const yAxisX = left + width * yAxisFraction;

  return (
    <>
      <Line
        x1={left}
        y1={xAxisY}
        x2={left + width}
        y2={xAxisY}
        stroke="#B4A79D"
        strokeWidth={1.1}
      />
      <Line
        x1={yAxisX}
        y1={top + height}
        x2={yAxisX}
        y2={top}
        stroke="#B4A79D"
        strokeWidth={1.1}
      />
    </>
  );
}

function buildGraphPath({
  fn,
  xMin,
  xMax,
  yMin,
  yMax,
  left,
  top,
  width,
  height,
  samples = 120,
}: {
  fn: (x: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  left: number;
  top: number;
  width: number;
  height: number;
  samples?: number;
}) {
  const commands: string[] = [];
  let drawing = false;
  let previousY: number | null = null;

  for (let index = 0; index <= samples; index += 1) {
    const x = xMin + (index / samples) * (xMax - xMin);
    const y = fn(x);
    const isVisible = Number.isFinite(y) && y >= yMin && y <= yMax;
    const hasLargeJump =
      previousY !== null && Math.abs(y - previousY) > (yMax - yMin) * 0.45;

    if (!isVisible || hasLargeJump) {
      drawing = false;
      previousY = Number.isFinite(y) ? y : null;
      continue;
    }

    const svgX = left + ((x - xMin) / (xMax - xMin)) * width;
    const svgY = top + ((yMax - y) / (yMax - yMin)) * height;

    commands.push(`${drawing ? "L" : "M"} ${svgX.toFixed(2)} ${svgY.toFixed(2)}`);
    drawing = true;
    previousY = y;
  }

  return commands.join(" ");
}

function CommonPolynomialGraphsDiagram() {
  const panels = [
    {
      left: 14,
      label: "y = x",
      path: buildGraphPath({
        fn: (x) => x,
        xMin: -2,
        xMax: 2,
        yMin: -2,
        yMax: 2,
        left: 14,
        top: 25,
        width: 88,
        height: 118,
      }),
    },
    {
      left: 116,
      label: "y = x²",
      path: buildGraphPath({
        fn: (x) => x ** 2,
        xMin: -2,
        xMax: 2,
        yMin: -0.7,
        yMax: 4,
        left: 116,
        top: 25,
        width: 88,
        height: 118,
      }),
    },
    {
      left: 218,
      label: "y = x³",
      path: buildGraphPath({
        fn: (x) => x ** 3,
        xMin: -2,
        xMax: 2,
        yMin: -8,
        yMax: 8,
        left: 218,
        top: 25,
        width: 88,
        height: 118,
      }),
    },
  ];

  return (
    <>
      {panels.map((panel) => (
        <G key={panel.label}>
          <MiniAxes
            left={panel.left}
            top={25}
            width={88}
            height={118}
            xAxisFraction={panel.label === "y = x²" ? 0.85 : 0.5}
          />
          <Path
            d={panel.path}
            fill="none"
            stroke={C.primary}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <SvgText
            x={panel.left + 44}
            y={169}
            textAnchor="middle"
            fontSize={11}
            fontWeight="900"
            fill={C.ink}
          >
            {panel.label}
          </SvgText>
        </G>
      ))}
    </>
  );
}

function RootModulusGraphsDiagram() {
  const squareRootPath = buildGraphPath({
    fn: (x) => Math.sqrt(x),
    xMin: -2,
    xMax: 5,
    yMin: -1,
    yMax: 2.6,
    left: 18,
    top: 25,
    width: 132,
    height: 120,
  });

  const modulusPath = buildGraphPath({
    fn: (x) => Math.abs(x),
    xMin: -3,
    xMax: 3,
    yMin: -1,
    yMax: 3.4,
    left: 170,
    top: 25,
    width: 132,
    height: 120,
  });

  return (
    <>
      <MiniAxes
        left={18}
        top={25}
        width={132}
        height={120}
        xAxisFraction={0.72}
        yAxisFraction={2 / 7}
      />
      <Path
        d={squareRootPath}
        fill="none"
        stroke={C.primary}
        strokeWidth={3.8}
        strokeLinecap="round"
      />
      <Circle cx={18 + (2 / 7) * 132} cy={25 + 0.72 * 120} r={4.5} fill={C.primary} />
      <SvgText x={84} y={169} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>
        y = √x
      </SvgText>

      <MiniAxes
        left={170}
        top={25}
        width={132}
        height={120}
        xAxisFraction={0.77}
        yAxisFraction={0.5}
      />
      <Path
        d={modulusPath}
        fill="none"
        stroke="#54749F"
        strokeWidth={3.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgText x={236} y={169} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>
        y = |x|
      </SvgText>
    </>
  );
}

function ReciprocalGraphDiagram() {
  const left = 34;
  const top = 18;
  const width = 252;
  const height = 146;

  const reciprocalPath = buildGraphPath({
    fn: (x) => 1 / x,
    xMin: -4,
    xMax: 4,
    yMin: -4,
    yMax: 4,
    left,
    top,
    width,
    height,
    samples: 220,
  });

  return (
    <>
      <Line
        x1={left}
        y1={top + height / 2}
        x2={left + width}
        y2={top + height / 2}
        stroke="#54749F"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      <Line
        x1={left + width / 2}
        y1={top}
        x2={left + width / 2}
        y2={top + height}
        stroke="#54749F"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      <Path
        d={reciprocalPath}
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <SvgText x={238} y={45} fontSize={12} fontWeight="900" fill={C.primary}>
        y = 1/x
      </SvgText>
      <SvgText x={160} y={184} textAnchor="middle" fontSize={11} fontWeight="800" fill={C.muted}>
        The axes are asymptotes, not intercepts
      </SvgText>
    </>
  );
}

function ExponentialLogGraphsDiagram() {
  const exponentialPath = buildGraphPath({
    fn: (x) => 2 ** x,
    xMin: -3,
    xMax: 3,
    yMin: -0.5,
    yMax: 8,
    left: 18,
    top: 22,
    width: 132,
    height: 126,
  });

  const logarithmPath = buildGraphPath({
    fn: (x) => Math.log2(x),
    xMin: -1,
    xMax: 6,
    yMin: -3,
    yMax: 3,
    left: 170,
    top: 22,
    width: 132,
    height: 126,
  });

  const expAxisY = 22 + (8 / 8.5) * 126;
  const expAxisX = 18 + 0.5 * 132;
  const logAxisY = 22 + 0.5 * 126;
  const logAxisX = 170 + (1 / 7) * 132;

  return (
    <>
      <MiniAxes
        left={18}
        top={22}
        width={132}
        height={126}
        xAxisFraction={8 / 8.5}
        yAxisFraction={0.5}
      />
      <Line x1={18} y1={expAxisY} x2={150} y2={expAxisY} stroke="#54749F" strokeWidth={1.5} strokeDasharray="5 4" />
      <Path d={exponentialPath} fill="none" stroke={C.primary} strokeWidth={3.8} strokeLinecap="round" />
      <Circle cx={expAxisX} cy={22 + ((8 - 1) / 8.5) * 126} r={4} fill={C.primary} />
      <SvgText x={84} y={171} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>
        y = 2ˣ
      </SvgText>

      <MiniAxes
        left={170}
        top={22}
        width={132}
        height={126}
        xAxisFraction={0.5}
        yAxisFraction={1 / 7}
      />
      <Line x1={logAxisX} y1={22} x2={logAxisX} y2={148} stroke="#54749F" strokeWidth={1.5} strokeDasharray="5 4" />
      <Path d={logarithmPath} fill="none" stroke="#54749F" strokeWidth={3.8} strokeLinecap="round" />
      <Circle cx={170 + (2 / 7) * 132} cy={logAxisY} r={4} fill="#54749F" />
      <SvgText x={236} y={171} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>
        y = log₂x
      </SvgText>
    </>
  );
}

function CommonTrigGraphsDiagram() {
  const left = 54;
  const width = 242;
  const rowHeight = 42;
  const rows = [
    { top: 10, label: "sin x", color: C.primary, fn: (x: number) => Math.sin(x) },
    { top: 69, label: "cos x", color: "#54749F", fn: (x: number) => Math.cos(x) },
    { top: 128, label: "tan x", color: "#C88A43", fn: (x: number) => Math.tan(x) },
  ];

  return (
    <>
      {rows.map((row) => {
        const path = buildGraphPath({
          fn: row.fn,
          xMin: -Math.PI,
          xMax: Math.PI,
          yMin: row.label === "tan x" ? -3 : -1.2,
          yMax: row.label === "tan x" ? 3 : 1.2,
          left,
          top: row.top,
          width,
          height: rowHeight,
          samples: 180,
        });

        return (
          <G key={row.label}>
            <Line x1={left} y1={row.top + rowHeight / 2} x2={left + width} y2={row.top + rowHeight / 2} stroke="#B4A79D" strokeWidth={1} />
            <Line x1={left + width / 2} y1={row.top} x2={left + width / 2} y2={row.top + rowHeight} stroke="#B4A79D" strokeWidth={1} />
            {row.label === "tan x" && (
              <>
                <Line x1={left + width / 4} y1={row.top} x2={left + width / 4} y2={row.top + rowHeight} stroke="#C88A43" strokeWidth={1.2} strokeDasharray="4 3" />
                <Line x1={left + (3 * width) / 4} y1={row.top} x2={left + (3 * width) / 4} y2={row.top + rowHeight} stroke="#C88A43" strokeWidth={1.2} strokeDasharray="4 3" />
              </>
            )}
            <Path d={path} fill="none" stroke={row.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <SvgText x={10} y={row.top + 26} fontSize={11} fontWeight="900" fill={row.color}>
              {row.label}
            </SvgText>
          </G>
        );
      })}
      <SvgText x={175} y={187} textAnchor="middle" fontSize={10} fontWeight="800" fill={C.muted}>
        −π                 0                 π
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
function MixedCircleTheoremDiagram() {
  const A = { x: 208, y: 95 };
  const B = { x: 111, y: 157 };
  const CPoint = { x: 81, y: 61 };
  const D = { x: 169, y: 33 };

  return (
    <>
      {/* Circle */}
      <Circle
        cx={140}
        cy={95}
        r={68}
        fill="#FFF8ED"
        stroke={C.primary}
        strokeWidth={3}
      />

      {/* Tangent at A */}
      <Line
        x1={A.x}
        y1={12}
        x2={A.x}
        y2={178}
        stroke="#54749F"
        strokeWidth={3}
      />

      {/* Cyclic quadrilateral ABCD */}
      <Line
        x1={A.x}
        y1={A.y}
        x2={B.x}
        y2={B.y}
        stroke="#C88A43"
        strokeWidth={2.7}
      />
      <Line
        x1={B.x}
        y1={B.y}
        x2={CPoint.x}
        y2={CPoint.y}
        stroke={C.ink}
        strokeWidth={2.2}
      />
      <Line
        x1={CPoint.x}
        y1={CPoint.y}
        x2={D.x}
        y2={D.y}
        stroke={C.ink}
        strokeWidth={2.2}
      />
      <Line
        x1={D.x}
        y1={D.y}
        x2={A.x}
        y2={A.y}
        stroke={C.ink}
        strokeWidth={2.2}
      />

      {/* Diagonal AC, needed for angles BAC and ACB */}
      <Line
        x1={A.x}
        y1={A.y}
        x2={CPoint.x}
        y2={CPoint.y}
        stroke={C.primary}
        strokeWidth={2.3}
      />

      {/* Tangent–chord angle at A */}
      <Path
        d="M 208 119 A 24 24 0 0 1 188 108"
        fill="none"
        stroke="#54749F"
        strokeWidth={2}
      />

      {/* Angle BAC */}
      <Path
        d="M 193 105 A 18 18 0 0 1 191 90"
        fill="none"
        stroke={C.primary}
        strokeWidth={2}
      />

      {/* Angle ACB: alternate-segment angle */}
      <Path
        d="M 99 66 A 18 18 0 0 1 87 78"
        fill="none"
        stroke="#54749F"
        strokeWidth={2}
      />

      {/* Angle ADC */}
      <Path
        d="M 178 47 A 16 16 0 0 1 154 38"
        fill="none"
        stroke="#C88A43"
        strokeWidth={2}
      />

      {/* Points */}
      {[A, B, CPoint, D].map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={C.ink}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ))}

      {/* Point labels */}
      <SvgText x={214} y={91} fontSize={12} fontWeight="900" fill={C.ink}>
        A
      </SvgText>
      <SvgText x={98} y={174} fontSize={12} fontWeight="900" fill={C.ink}>
        B
      </SvgText>
      <SvgText x={65} y={59} fontSize={12} fontWeight="900" fill={C.ink}>
        C
      </SvgText>
      <SvgText x={165} y={23} fontSize={12} fontWeight="900" fill={C.ink}>
        D
      </SvgText>

      {/* Angle and line labels */}
      <SvgText x={218} y={27} fontSize={10} fontWeight="800" fill="#54749F">
        tangent
      </SvgText>
      <SvgText x={220} y={113} fontSize={9.5} fontWeight="800" fill="#54749F">
        (2x + 12)°
      </SvgText>

      <SvgText x={151} y={94} fontSize={9.5} fontWeight="800" fill={C.primary}>
        x + 8°
      </SvgText>

      <SvgText x={121} y={56} fontSize={9.5} fontWeight="800" fill="#A66F2E">
        4x + 10°
      </SvgText>
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

function LineGradientDiagram() {
  return (
    <>
      <Axes xAxisY={151} yAxisX={39} />
      <Line x1={48} y1={139} x2={286} y2={39} stroke={C.primary} strokeWidth={4} />
      <Circle cx={91} cy={121} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={235} cy={60} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <Line x1={91} y1={121} x2={235} y2={121} stroke="#54749F" strokeWidth={1.8} strokeDasharray="5 4" />
      <Line x1={235} y1={121} x2={235} y2={60} stroke="#54749F" strokeWidth={1.8} strokeDasharray="5 4" />
      <SvgText x={145} y={137} fontSize={11} fontWeight="800" fill="#54749F">change in x</SvgText>
      <SvgText x={242} y={96} fontSize={11} fontWeight="800" fill="#54749F">change in y</SvgText>
      <SvgText x={77} y={111} fontSize={11} fontWeight="900" fill={C.ink}>A</SvgText>
      <SvgText x={242} y={56} fontSize={11} fontWeight="900" fill={C.ink}>B</SvgText>
    </>
  );
}

function ParallelPerpendicularDiagram() {
  return (
    <>
      <Axes xAxisY={157} yAxisX={37} />
      <Line x1={48} y1={134} x2={288} y2={45} stroke={C.primary} strokeWidth={3.5} />
      <Line x1={48} y1={160} x2={288} y2={71} stroke="#F4B25F" strokeWidth={3.5} />
      <Line x1={140} y1={35} x2={190} y2={170} stroke="#54749F" strokeWidth={3.5} />
      <Rect x={161} y={92} width={12} height={12} fill="none" stroke={C.ink} strokeWidth={1.5} transform="rotate(-20.4 161 92)" />
      <SvgText x={244} y={39} fontSize={11} fontWeight="800" fill={C.primary}>parallel</SvgText>
      <SvgText x={221} y={151} fontSize={11} fontWeight="800" fill="#54749F">perpendicular</SvgText>
    </>
  );
}

function CoordinateCircleDiagram() {
  return (
    <>
      <Axes xAxisY={112} yAxisX={143} />
      <Circle cx={188} cy={79} r={52} fill="#FFF6E8" stroke={C.primary} strokeWidth={4} />
      <Circle cx={188} cy={79} r={4.5} fill={C.ink} />
      <Line x1={188} y1={79} x2={226} y2={44} stroke="#54749F" strokeWidth={2.5} strokeDasharray="5 4" />
      <SvgText x={195} y={74} fontSize={11} fontWeight="900" fill={C.ink}>(a, b)</SvgText>
      <SvgText x={208} y={55} fontSize={12} fontWeight="900" fill="#54749F">r</SvgText>
    </>
  );
}

function LineCircleIntersectionsDiagram() {
  return (
    <>
      <Axes xAxisY={151} yAxisX={42} />
      <Circle cx={164} cy={91} r={65} fill="#FFF9F1" stroke={C.primary} strokeWidth={4} />
      <Line x1={80} y1={154} x2={250} y2={26.5} stroke="#54749F" strokeWidth={3} />
      <Circle cx={112} cy={130} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={216} cy={52} r={5} fill={C.ink} stroke="#FFFFFF" strokeWidth={2} />
      <SvgText x={93} y={123} fontSize={11} fontWeight="900" fill={C.ink}>P</SvgText>
      <SvgText x={223} y={48} fontSize={11} fontWeight="900" fill={C.ink}>Q</SvgText>
    </>
  );
}

function CircleChordBisectorDiagram() {
  return (
    <>
      <Circle cx={160} cy={95} r={72} fill="#FFF8ED" stroke={C.primary} strokeWidth={4} />
      <Line x1={99} y1={57} x2={221} y2={57} stroke="#C88A43" strokeWidth={3} />
      <Circle cx={160} cy={95} r={4.5} fill={C.ink} />
      <Line x1={160} y1={95} x2={160} y2={57} stroke="#54749F" strokeWidth={2.5} />
      <Line x1={160} y1={95} x2={160} y2={167} stroke="#54749F" strokeWidth={2.5} strokeDasharray="6 4" />
      <Rect x={160} y={57} width={11} height={11} fill="none" stroke={C.ink} strokeWidth={1.4} />
      <Circle cx={160} cy={57} r={4} fill={C.ink} />
      <SvgText x={105} y={48} fontSize={11} fontWeight="800" fill="#A66F2E">chord</SvgText>
      <SvgText x={174} y={61} fontSize={11} fontWeight="900" fill={C.ink}>midpoint</SvgText>
    </>
  );
}

function TriangleLawsDiagram() {
  return (
    <>
      <Polygon
        points="48,151 270,151 184,34"
        fill="#FFF4E2"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      <SvgText x={33} y={166} fontSize={13} fontWeight="900" fill={C.ink}>
        A
      </SvgText>
      <SvgText x={274} y={166} fontSize={13} fontWeight="900" fill={C.ink}>
        B
      </SvgText>
      <SvgText x={180} y={25} fontSize={13} fontWeight="900" fill={C.ink}>
        C
      </SvgText>

      <SvgText x={239} y={91} fontSize={13} fontWeight="900" fill="#54749F">
        a
      </SvgText>
      <SvgText x={105} y={89} fontSize={13} fontWeight="900" fill="#54749F">
        b
      </SvgText>
      <SvgText x={155} y={169} fontSize={13} fontWeight="900" fill="#54749F">
        c
      </SvgText>

      <Path
        d="M 72 151 A 24 24 0 0 0 66 136"
        fill="none"
        stroke="#C88A43"
        strokeWidth={2.5}
      />

      <SvgText x={72} y={145} fontSize={11} fontWeight="800" fill="#A66F2E">
        A
      </SvgText>
    </>
  );
}

function AmbiguousSineDiagram() {
  return (
    <>
      <Line x1={38} y1={154} x2={270} y2={154} stroke={C.ink} strokeWidth={2.5} />
      <Line x1={38} y1={154} x2={270} y2={20} stroke={C.primary} strokeWidth={3.5} />
      <Circle
        cx={270}
        cy={154}
        r={125}
        fill="none"
        stroke="#F4B25F"
        strokeWidth={3}
        strokeDasharray="6 4"
      />
      <Circle cx={171.6} cy={76.9} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={252.3} cy={30.2} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <Line x1={171.6} y1={76.9} x2={270} y2={154} stroke="#54749F" strokeWidth={3} />
      <Line x1={252.3} y1={30.2} x2={270} y2={154} stroke="#54749F" strokeWidth={3} />
      <Path d="M 68 154 A 27 27 0 0 1 65 142" fill="none" stroke="#C88A43" strokeWidth={2.5} />
      <SvgText x={28} y={170} fontSize={12} fontWeight="900" fill={C.ink}>A</SvgText>
      <SvgText x={275} y={170} fontSize={12} fontWeight="900" fill={C.ink}>B</SvgText>
      <SvgText x={75} y={145} fontSize={11} fontWeight="800" fill="#A66F2E">given angle</SvgText>
      <SvgText x={151} y={70} fontSize={11} fontWeight="900" fill={C.ink}>C₁</SvgText>
      <SvgText x={260} y={27} fontSize={11} fontWeight="900" fill={C.ink}>C₂</SvgText>
    </>
  );
}

function RadiansSectorDiagram() {
  return (
    <>
      <Path
        d="M 148 104 L 252 104 A 104 104 0 0 0 205 17 Z"
        fill="#FFE2BA"
        stroke={C.primary}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Circle cx={148} cy={104} r={4.5} fill={C.ink} />
      <Path d="M 181 104 A 33 33 0 0 0 166 79" fill="none" stroke="#54749F" strokeWidth={3} />
      <SvgText x={184} y={91} fontSize={14} fontWeight="900" fill="#54749F">θ</SvgText>
      <SvgText x={194} y={119} fontSize={13} fontWeight="900" fill={C.ink}>r</SvgText>
      <SvgText x={168} y={56} fontSize={13} fontWeight="900" fill={C.ink}>r</SvgText>
      <SvgText
        x={218}
        y={59}
        fontSize={12}
        fontWeight="900"
        fill="#A66F2E"
      >
        arc = rθ
      </SvgText>
      <SvgText x={30} y={173} fontSize={12} fontWeight="800" fill={C.muted}>θ must be measured in radians</SvgText>
    </>
  );
}

function UnitCircleValuesDiagram() {
  return (
    <>
      <Circle cx={151} cy={97} r={70} fill="#FFF9F1" stroke={C.primary} strokeWidth={3.5} />
      <Line x1={68} y1={97} x2={267} y2={97} stroke="#9D8E82" strokeWidth={1.5} />
      <Line x1={151} y1={174} x2={151} y2={18} stroke="#9D8E82" strokeWidth={1.5} />
      <Line x1={151} y1={97} x2={207} y2={55} stroke="#54749F" strokeWidth={3} />
      <Line x1={207} y1={55} x2={207} y2={97} stroke="#C88A43" strokeWidth={2.5} strokeDasharray="5 4" />
      <Circle cx={207} cy={55} r={5} fill={C.primary} stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M 176 97 A 25 25 0 0 0 171 82" fill="none" stroke={C.primary} strokeWidth={2.5} />
      <SvgText x={176} y={91} fontSize={13} fontWeight="900" fill={C.primary}>θ</SvgText>
      <SvgText x={174} y={77} fontSize={12} fontWeight="900" fill="#54749F">1</SvgText>
      <SvgText x={169} y={112} fontSize={11} fontWeight="800" fill={C.ink}>cos θ</SvgText>
      <SvgText x={213} y={80} fontSize={11} fontWeight="800" fill={C.ink}>sin θ</SvgText>
    </>
  );
}

function TrigGraphsDiagram() {
  return (
    <>
      <Axes xAxisY={96} yAxisX={38} />
      <Path
        d="M 38 96 C 61 32, 85 32, 108 96 C 131 160, 155 160, 178 96 C 201 32, 225 32, 248 96 C 267 149, 284 157, 302 119"
        fill="none"
        stroke={C.primary}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M 38 36 C 50 36, 61 60, 73 96 C 85 132, 96 156, 108 156 C 120 156, 131 132, 143 96 C 155 60, 166 36, 178 36 C 190 36, 201 60, 213 96 C 225 132, 236 156, 248 156 C 260 156, 272 132, 284 96 C 290 78, 296 55, 302 44"
        fill="none"
        stroke="#54749F"
        strokeWidth={3}
        strokeDasharray="7 4"
      />
      <SvgText x={56} y={29} fontSize={11} fontWeight="900" fill={C.primary}>sin x</SvgText>
      <SvgText x={229} y={31} fontSize={11} fontWeight="900" fill="#54749F">cos x</SvgText>
      <SvgText x={102} y={111} fontSize={10} fontWeight="800" fill={C.muted}>π</SvgText>
      <SvgText x={171} y={111} fontSize={10} fontWeight="800" fill={C.muted}>2π</SvgText>
      <SvgText x={242} y={111} fontSize={10} fontWeight="800" fill={C.muted}>3π</SvgText>
    </>
  );
}

function TrigSolutionsDiagram() {
  const graphLeft = 38;
  const graphRight = 302;
  const graphWidth = graphRight - graphLeft;

  const centreY = 105;
  const amplitude = 65;

  // Height of the horizontal line y = k.
  // k must remain between -1 and 1.
  const k = 0.55;

  const xToSvg = (x: number) =>
    graphLeft + (x / (2 * Math.PI)) * graphWidth;

  const yToSvg = (y: number) =>
    centreY - y * amplitude;

  // Generate the sine curve using actual sampled sine values.
  const sampleCount = 80;

  const sinePath = Array.from(
    { length: sampleCount + 1 },
    (_, index) => {
      const x = (index / sampleCount) * 2 * Math.PI;
      const svgX = xToSvg(x);
      const svgY = yToSvg(Math.sin(x));

      return `${index === 0 ? "M" : "L"} ${svgX} ${svgY}`;
    }
  ).join(" ");

  // Exact intersections of sin(x) = k in one cycle.
  const theta = Math.asin(k);
  const secondTheta = Math.PI - theta;

  const firstIntersectionX = xToSvg(theta);
  const secondIntersectionX = xToSvg(secondTheta);
  const intersectionY = yToSvg(k);

  return (
    <>
      {/* Coordinate axes */}
      <Line
        x1={graphLeft}
        y1={centreY}
        x2={graphRight}
        y2={centreY}
        stroke="#9D8E82"
        strokeWidth={1.5}
      />

      <Polygon
        points={`${graphRight},${centreY} ${graphRight - 8},${centreY - 4} ${graphRight - 8},${centreY + 4}`}
        fill="#9D8E82"
      />

      <Line
        x1={graphLeft}
        y1={174}
        x2={graphLeft}
        y2={20}
        stroke="#9D8E82"
        strokeWidth={1.5}
      />

      <Polygon
        points={`${graphLeft},20 ${graphLeft - 4},28 ${graphLeft + 4},28`}
        fill="#9D8E82"
      />

      {/* Sine graph */}
      <Path
        d={sinePath}
        fill="none"
        stroke={C.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Horizontal line y = k */}
      <Line
        x1={graphLeft}
        y1={intersectionY}
        x2={graphRight}
        y2={intersectionY}
        stroke="#C88A43"
        strokeWidth={2.5}
        strokeDasharray="7 5"
      />

      {/* Exact vertical guides */}
      <Line
        x1={firstIntersectionX}
        y1={intersectionY}
        x2={firstIntersectionX}
        y2={centreY}
        stroke="#54749F"
        strokeWidth={1.6}
        strokeDasharray="5 4"
      />

      <Line
        x1={secondIntersectionX}
        y1={intersectionY}
        x2={secondIntersectionX}
        y2={centreY}
        stroke="#54749F"
        strokeWidth={1.6}
        strokeDasharray="5 4"
      />

      {/* Exact intersection points */}
      <Circle
        cx={firstIntersectionX}
        cy={intersectionY}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      <Circle
        cx={secondIntersectionX}
        cy={intersectionY}
        r={5}
        fill={C.primary}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Axis labels */}
      <SvgText
        x={graphRight - 8}
        y={centreY - 8}
        fontSize={12}
        fontWeight="700"
        fill={C.muted}
      >
        x
      </SvgText>

      <SvgText
        x={graphLeft + 8}
        y={28}
        fontSize={12}
        fontWeight="700"
        fill={C.muted}
      >
        y
      </SvgText>

      {/* Solution labels */}
      <SvgText
        x={firstIntersectionX}
        y={centreY + 18}
        textAnchor="middle"
        fontSize={12}
        fontWeight="900"
        fill="#54749F"
      >
        θ
      </SvgText>

      <SvgText
        x={secondIntersectionX}
        y={centreY + 18}
        textAnchor="middle"
        fontSize={12}
        fontWeight="900"
        fill="#54749F"
      >
        π − θ
      </SvgText>

      {/* Standard x-axis values */}
      <SvgText
        x={xToSvg(Math.PI)}
        y={centreY + 18}
        textAnchor="middle"
        fontSize={10}
        fontWeight="800"
        fill={C.muted}
      >
        π
      </SvgText>

      <SvgText
        x={graphRight - 4}
        y={centreY + 18}
        textAnchor="middle"
        fontSize={10}
        fontWeight="800"
        fill={C.muted}
      >
        2π
      </SvgText>

      {/* Horizontal-line label */}
      <SvgText
        x={graphRight - 6}
        y={intersectionY - 8}
        textAnchor="end"
        fontSize={12}
        fontWeight="900"
        fill="#A66F2E"
      >
        y = k
      </SvgText>

      <SvgText
        x={170}
        y={187}
        textAnchor="middle"
        fontSize={11}
        fontWeight="800"
        fill={C.muted}
      >
        Two intersections give two matching angles
      </SvgText>
    </>
  );
}
function ImplicationFlowDiagram() {
  return (
    <>
      <Rect x={24} y={24} width={106} height={48} rx={16} fill="#FFF0D9" stroke={C.primary} strokeWidth={2.5} />
      <Rect x={190} y={24} width={106} height={48} rx={16} fill="#E9F3FD" stroke="#54749F" strokeWidth={2.5} />
      <SvgText x={77} y={45} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>condition</SvgText>
      <SvgText x={77} y={61} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.muted}>A is true</SvgText>
      <SvgText x={243} y={45} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>conclusion</SvgText>
      <SvgText x={243} y={61} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.muted}>B must follow</SvgText>
      <Line x1={130} y1={48} x2={188} y2={48} stroke={C.ink} strokeWidth={2.5} />
      <Polygon points="188,48 178,43 178,53" fill={C.ink} />
      <SvgText x={159} y={37} textAnchor="middle" fontSize={10} fontWeight="800" fill={C.primary}>if A, then B</SvgText>
      <Rect x={24} y={113} width={106} height={48} rx={16} fill="#E9F3FD" stroke="#54749F" strokeWidth={2.5} />
      <Rect x={190} y={113} width={106} height={48} rx={16} fill="#FFF0D9" stroke={C.primary} strokeWidth={2.5} />
      <SvgText x={77} y={134} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>not B</SvgText>
      <SvgText x={77} y={150} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.muted}>conclusion fails</SvgText>
      <SvgText x={243} y={134} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.ink}>not A</SvgText>
      <SvgText x={243} y={150} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.muted}>condition must fail</SvgText>
      <Line x1={130} y1={137} x2={188} y2={137} stroke={C.ink} strokeWidth={2.5} />
      <Polygon points="188,137 178,132 178,142" fill={C.ink} />
      <SvgText x={159} y={178} textAnchor="middle" fontSize={11} fontWeight="900" fill="#54749F">the contrapositive is equivalent</SvgText>
    </>
  );
}

function NecessarySufficientDiagram() {
  return (
    <>
      <Circle cx={160} cy={96} r={80} fill="#E9F3FD" stroke="#54749F" strokeWidth={3} />
      <Circle cx={160} cy={96} r={47} fill="#FFF0D9" stroke={C.primary} strokeWidth={3} />
      <SvgText x={160} y={44} textAnchor="middle" fontSize={11} fontWeight="900" fill="#54749F">even integers</SvgText>
      <SvgText x={160} y={91} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.primary}>multiples</SvgText>
      <SvgText x={160} y={107} textAnchor="middle" fontSize={11} fontWeight="900" fill={C.primary}>of 4</SvgText>
      <SvgText x={160} y={184} textAnchor="middle" fontSize={11} fontWeight="800" fill={C.muted}>inside implies outside, not conversely</SvgText>
    </>
  );
}

function QuantifierScopeDiagram() {
  const points = [76, 110, 144, 178, 212, 246];
  return (
    <>
      <SvgText x={28} y={38} fontSize={12} fontWeight="900" fill={C.ink}>“for all”</SvgText>
      {points.map((x) => (
        <Circle key={`all-${x}`} cx={x} cy={67} r={11} fill="#FFD6A8" stroke={C.primary} strokeWidth={2} />
      ))}
      <Line x1={63} y1={88} x2={259} y2={88} stroke={C.primary} strokeWidth={2} />
      <SvgText x={160} y={104} textAnchor="middle" fontSize={10} fontWeight="800" fill={C.muted}>every object must satisfy the claim</SvgText>
      <SvgText x={28} y={134} fontSize={12} fontWeight="900" fill={C.ink}>“for some”</SvgText>
      {points.map((x, index) => (
        <Circle
          key={`some-${x}`}
          cx={x}
          cy={159}
          r={11}
          fill={index === 3 ? C.primary : "#F1ECE7"}
          stroke={index === 3 ? C.primary : "#B8ACA2"}
          strokeWidth={2}
        />
      ))}
      <SvgText x={160} y={187} textAnchor="middle" fontSize={10} fontWeight="800" fill={C.muted}>at least one example is enough</SvgText>
    </>
  );
}

function ProofChainDiagram() {
  const boxes = [
    { x: 14, label: "given" },
    { x: 112, label: "deduce" },
    { x: 210, label: "conclude" },
  ];
  return (
    <>
      {boxes.map((box) => (
        <Rect key={box.x} x={box.x} y={62} width={84} height={54} rx={16} fill={box.x === 112 ? "#FFF0D9" : "#E9F3FD"} stroke={box.x === 112 ? C.primary : "#54749F"} strokeWidth={2.5} />
      ))}
      {boxes.map((box) => (
        <SvgText key={box.label} x={box.x + 42} y={94} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.ink}>{box.label}</SvgText>
      ))}
      <Line x1={98} y1={89} x2={110} y2={89} stroke={C.ink} strokeWidth={2.5} />
      <Polygon points="110,89 102,84 102,94" fill={C.ink} />
      <Line x1={196} y1={89} x2={208} y2={89} stroke={C.ink} strokeWidth={2.5} />
      <Polygon points="208,89 200,84 200,94" fill={C.ink} />
      <SvgText x={160} y={37} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.primary}>each arrow needs a valid reason</SvgText>
      <SvgText x={160} y={146} textAnchor="middle" fontSize={11} fontWeight="800" fill={C.muted}>definitions · algebra · known results</SvgText>
    </>
  );
}

function ProofByCasesDiagram() {
  return (
    <>
      <Rect x={105} y={17} width={110} height={42} rx={14} fill="#FFF0D9" stroke={C.primary} strokeWidth={2.5} />
      <SvgText x={160} y={43} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.ink}>every integer</SvgText>
      <Line x1={160} y1={59} x2={91} y2={103} stroke={C.ink} strokeWidth={2.5} />
      <Line x1={160} y1={59} x2={229} y2={103} stroke={C.ink} strokeWidth={2.5} />
      <Rect x={31} y={103} width={120} height={48} rx={15} fill="#E9F3FD" stroke="#54749F" strokeWidth={2.5} />
      <Rect x={169} y={103} width={120} height={48} rx={15} fill="#E9F3FD" stroke="#54749F" strokeWidth={2.5} />
      <SvgText x={91} y={132} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.ink}>even case</SvgText>
      <SvgText x={229} y={132} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.ink}>odd case</SvgText>
      <SvgText x={160} y={179} textAnchor="middle" fontSize={11} fontWeight="800" fill={C.muted}>exhaustive cases cover every possibility</SvgText>
    </>
  );
}

function CounterexampleSearchDiagram() {
  const points = [58, 96, 134, 172, 210, 248];
  return (
    <>
      <SvgText x={160} y={31} textAnchor="middle" fontSize={12} fontWeight="900" fill={C.ink}>test the universal claim</SvgText>
      <Line x1={45} y1={93} x2={271} y2={93} stroke="#CFC5BD" strokeWidth={3} />
      {points.map((x, index) => (
        <Circle key={x} cx={x} cy={93} r={15} fill={index === 4 ? "#FFE0DF" : "#E7F9F1"} stroke={index === 4 ? "#D95D59" : "#55A982"} strokeWidth={2.5} />
      ))}
      {points.map((x, index) => (
        <SvgText key={`mark-${x}`} x={x} y={99} textAnchor="middle" fontSize={16} fontWeight="900" fill={index === 4 ? "#D95D59" : "#318064"}>{index === 4 ? "×" : "✓"}</SvgText>
      ))}
      <Line x1={210} y1={111} x2={210} y2={143} stroke="#D95D59" strokeWidth={2} strokeDasharray="4 3" />
      <SvgText x={210} y={160} textAnchor="middle" fontSize={11} fontWeight="900" fill="#D95D59">one failure disproves “all”</SvgText>
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
        {diagram.kind === "cubic-stationary-points" && (
          <CubicStationaryPointsDiagram />
        )}
        {diagram.kind === "signed-area" && <SignedAreaDiagram />}
        {diagram.kind === "trapezium-rule" && <TrapeziumRuleDiagram />}
        {diagram.kind === "common-polynomial-graphs" && <CommonPolynomialGraphsDiagram />}
        {diagram.kind === "root-modulus-graphs" && <RootModulusGraphsDiagram />}
        {diagram.kind === "reciprocal-graph" && <ReciprocalGraphDiagram />}
        {diagram.kind === "exponential-log-graphs" && <ExponentialLogGraphsDiagram />}
        {diagram.kind === "common-trig-graphs" && <CommonTrigGraphsDiagram />}
        {diagram.kind === "graph-transformations" && <GraphTransformationsDiagram />}
        {diagram.kind === "function-intersections" && <FunctionIntersectionsDiagram />}
        {diagram.kind === "similarity-scale" && <SimilarityScaleDiagram />}
        {diagram.kind === "circle-theorems" && <CircleTheoremsDiagram />}
        {diagram.kind === "mixed-circle-theorem" && <MixedCircleTheoremDiagram />}
        {diagram.kind === "histogram-density" && <HistogramDensityDiagram />}
        {diagram.kind === "cumulative-frequency" && <CumulativeFrequencyDiagram />}
        {diagram.kind === "scatter-correlation" && <ScatterCorrelationDiagram />}
        {diagram.kind === "probability-tree" && <ProbabilityTreeDiagram />}
        {diagram.kind === "line-gradient" && <LineGradientDiagram />}
        {diagram.kind === "parallel-perpendicular" && <ParallelPerpendicularDiagram />}
        {diagram.kind === "coordinate-circle" && <CoordinateCircleDiagram />}
        {diagram.kind === "line-circle-intersections" && <LineCircleIntersectionsDiagram />}
        {diagram.kind === "circle-chord-bisector" && <CircleChordBisectorDiagram />}
        {diagram.kind === "triangle-laws" && <TriangleLawsDiagram />}
        {diagram.kind === "ambiguous-sine" && <AmbiguousSineDiagram />}
        {diagram.kind === "radians-sector" && <RadiansSectorDiagram />}
        {diagram.kind === "unit-circle-values" && <UnitCircleValuesDiagram />}
        {diagram.kind === "trig-graphs" && <TrigGraphsDiagram />}
        {diagram.kind === "trig-solutions" && <TrigSolutionsDiagram />}
        {diagram.kind === "implication-flow" && <ImplicationFlowDiagram />}
        {diagram.kind === "necessary-sufficient" && <NecessarySufficientDiagram />}
        {diagram.kind === "quantifier-scope" && <QuantifierScopeDiagram />}
        {diagram.kind === "proof-chain" && <ProofChainDiagram />}
        {diagram.kind === "proof-by-cases" && <ProofByCasesDiagram />}
        {diagram.kind === "counterexample-search" && <CounterexampleSearchDiagram />}
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