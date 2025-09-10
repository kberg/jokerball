/**
 * A cube coordinate. Not all 3 axes are necessary, the third axis is always implied.
 * aka the input is what's known as an 'axial' coordinate.
 */
class Coord {
  /** Create a Coord from axial coordinates. */
  constructor(q, r) {
    this.q = q
    this.r = r;
    this.s = -q - r;
  }

  /**
   * Add another coord to this coord.
   *
   * @param {Coord} coords the other addend.
   * @returns {Coord} another coordinate.
   */
  add(coords) {
    return new Coord(this.q + coords.q, this.r + coords.r, -1);
  }

  /**
   * Return the coord next to this, in the specified compass direction.
   * @param {Direction} direction the direction of the neighbor
   * @returns {Coord} a new coordinate in the given direction.
   */
  neighbor(direction) {
    return this.add(AXIAL_DIRECTION_VECTORS[direction]);
  }
}

/**
 * Creates an instance of `Coord`
 * @param {number} q
 * @param {number} r
 * @returns {Coord}
 */
function coords(q, r) {
  return new Coord(q, r);
}

/**
 * The compass directions of neighbor hexes. Jokerball uses pointy-top orientation, which
 * defines these six directions.
 */
const Direction = {
  E: 0,
  NE: 1,
  NW: 2,
  W: 3,
  SW: 4,
  SE: 5,
};

/**
 * Vectors of the six compass directions.
 */
const AXIAL_DIRECTION_VECTORS = [
  coords(+1, 0), // E
  coords(+1, -1), // NE
  coords(0, -1), // NW
  coords(-1, 0), // W
  coords(-1, +1), // SW
  coords(0, +1), // SE
];
