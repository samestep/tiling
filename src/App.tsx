import {
  Mafs,
  Circle,
  useMovablePoint,
  Polygon,
  Coordinates,
  Theme,
} from "mafs";

type Point = { x: number; y: number };

type Circle = {
  center: Point;
  radius: number;
};

function isPolygonContainedInCircle(polygon: Point[], circle: Circle): boolean {
  for (const vertex of polygon) {
    if (!isPointInsideCircle(vertex, circle)) {
      return false;
    }
  }
  return true;
}

function isPointInsideCircle(point: Point, circle: Circle): boolean {
  const distance = Math.sqrt(
    Math.pow(point.x - circle.center.x, 2) +
      Math.pow(point.y - circle.center.y, 2)
  );
  return distance <= circle.radius;
}

function dotProduct(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function subtractPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function normalize(vector: Point): Point {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return { x: vector.x / length, y: vector.y / length };
}

function projectPolygon(axis: Point, vertices: Point[]): [number, number] {
  let min = dotProduct(axis, vertices[0]);
  let max = min;
  for (let i = 1; i < vertices.length; i++) {
    const projection = dotProduct(axis, vertices[i]);
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return [min, max];
}

function projectCircle(
  axis: Point,
  center: Point,
  radius: number
): [number, number] {
  const projection = dotProduct(axis, center);
  return [projection - radius, projection + radius];
}

function overlap(
  [minA, maxA]: [number, number],
  [minB, maxB]: [number, number]
): boolean {
  return maxA >= minB && maxB >= minA;
}

function circlePolygonCollision(
  circleCenter: Point,
  circleRadius: number,
  polygonVertices: Point[]
): boolean {
  // Check polygon axes
  for (let i = 0; i < polygonVertices.length; i++) {
    const nextIndex = (i + 1) % polygonVertices.length;
    const edge = subtractPoints(polygonVertices[nextIndex], polygonVertices[i]);
    const axis = normalize({ x: -edge.y, y: edge.x });
    const projection1 = projectPolygon(axis, polygonVertices);
    const projection2 = projectCircle(axis, circleCenter, circleRadius);
    if (!overlap(projection1, projection2)) {
      return false;
    }
  }

  // Check circle axis
  const closestVertex = polygonVertices.reduce((closest, vertex) => {
    const distanceToVertex = subtractPoints(vertex, circleCenter);
    const distanceToClosest = subtractPoints(closest, circleCenter);
    return dotProduct(distanceToVertex, distanceToVertex) <
      dotProduct(distanceToClosest, distanceToClosest)
      ? vertex
      : closest;
  }, polygonVertices[0]);
  const circleAxis = normalize(subtractPoints(closestVertex, circleCenter));
  const projection3 = projectPolygon(circleAxis, polygonVertices);
  const projection4 = projectCircle(circleAxis, circleCenter, circleRadius);
  if (!overlap(projection3, projection4)) {
    return false;
  }

  return true;
}

const brickWidth = 0.5;
const brickHeight = 0.25;

function generateBrickTiling(width: number, height: number): Point[][] {
  const bricks: Point[][] = [];

  const offsetX = width / 2 - brickWidth / 2;
  const offsetY = height / 2 - brickHeight / 2;

  for (let y = -offsetY; y < offsetY; y += brickHeight) {
    const stagger =
      ((y + offsetY) / brickHeight) % 2 === 1 ? brickWidth / 2 : 0;
    for (let x = -offsetX + stagger; x < offsetX; x += brickWidth) {
      const topLeft: Point = { x, y };
      const topRight: Point = { x: x + brickWidth, y };
      const bottomLeft: Point = { x, y: y + brickHeight };
      const bottomRight: Point = { x: x + brickWidth, y: y + brickHeight };
      const brick = [topLeft, topRight, bottomRight, bottomLeft];
      bricks.push(brick);
    }
  }

  return bricks;
}

// Example usage:
const bricks = generateBrickTiling(10, 5);
console.log(bricks);

function CircleWithRectangles() {
  const point1 = useMovablePoint([2, 2]);
  const point2 = useMovablePoint([-2, -2]);

  // Manually calculate the midpoint and distance
  const center: Point = {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
  const radius =
    Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2) / 2;

  let containCount = 0;
  let overlapCount = 0;
  const rectangles = generateBrickTiling(10, 10);
  const predicates = rectangles.map((points) => {
    return {
      overlap: circlePolygonCollision(center, radius, points),
      contain: isPolygonContainedInCircle(points, { center, radius }),
    };
  });
  const background = rectangles
    .filter((_, i) => !predicates[i].overlap)
    .map((points, index) => (
      <Polygon
        key={index}
        color={"grey"}
        points={points.map(({ x, y }) => [x, y])}
      />
    ));
  const overlapping = rectangles
    .filter((_, i) => predicates[i].overlap)
    .map((points, index) => {
      overlapCount++;
      return (
        <Polygon
          key={index}
          color={"lightgrey"}
          points={points.map(({ x, y }) => [x, y])}
        />
      );
    });
  const contained = rectangles
    .filter((_, i) => predicates[i].contain)
    .map((points, index) => {
      containCount++;
      return (
        <Polygon
          key={index}
          color={"white"}
          points={points.map(({ x, y }) => [x, y])}
        />
      );
    });

  return (
    <>
      <Mafs>
        <Coordinates.Cartesian />
        {background}
        {overlapping}
        {contained}
        <Circle
          center={[center.x, center.y]}
          radius={radius}
          color={Theme.blue}
        />
        {point1.element}
        {point2.element}
      </Mafs>
      <p>
        Brick size: {brickWidth} x {brickHeight}
      </p>
      <p>
        Circle: radius {radius}, centered at ({center.x}, {center.y})
      </p>
      <p>Contained rectangles: {containCount}</p>
      <p>Overlapping rectangles: {overlapCount}</p>
    </>
  );
}

export default CircleWithRectangles;
