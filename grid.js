/** The type of hex */
const HexType = {
  PLAY_AREA: undefined,
  /** The northern or southern goal. Checkers entering this space leave the game. Balls entering this space end the game */
  GOAL: 'goal',
  /** The eastern and western borders. Nothing moves past them. */
  WALL: 'wall',
}

const _HexTypeValues = new Set(Object.values(HexType));

const Occupied = {
  /** An empty space in the play area */
  EMPTY: undefined,
  /** A space holding the ball. */
  BALL: 'ball',
  /** Player 0 */
  RED: 'red',
  /** Player 1 */
  BLUE: 'blue',
};

const _OccupiedValues = new Set(Object.values(Occupied));

/**
 * A hex in the game's grid.
 */
class Hex {
  #type = HexType.EMPTY;
  #occupied = Occupied.EMPTY;

  constructor(coords, idx, type) {
    this.coords = coords;
    this.idx = idx;
    this.#type = type ?? HexType.PLAY_AREA;
  }

  get type() {
    return this.#type;
  }

  set type(type) {
    if (!_HexTypeValues.has(type)) {
      throw new Error('Invalid type value ' + type);
    }
    this.#type = type;
  }

  get occupied() {
    return this.#occupied;
  }

  set occupied(occupied) {
    if (!_OccupiedValues.has(occupied)) {
      throw new Error('Invalid occupied value ' + occupied);
    }
    this.#occupied = occupied;
  }
}

/**
 * The grid where the game takes place.
 */
class Grid {
  /**
   * Constructs a hexagonal grid of a given size.
   * The size determines the radius of the grid from the center.
   * @param {number} size - The radius of the hexagonal grid.
   */
  constructor(size) {
    this.size = size;
    this.hexes = this.generateHexGrid(size);
  }

  /**
   * Generates a hexagonal grid array based on the given size.
   * This method is called by the constructor.
   * @param {number} size - The radius of the hexagonal grid.
   * @returns {Hex[]} An array of Hex objects forming the grid.
   */
  generateHexGrid(size) {
    const hexes = [];
    for (let q = -size; q <= size; q++) {
      const r1 = Math.max(-size, -q - size);
      const r2 = Math.min(size, -q + size);
      for (let r = r1; r <= r2; r++) {
        hexes.push(new Hex(coords(q, r), hexes.length));
      }
    }
    return hexes;
  }

  /**
   * @param {Coord} coord
   * @returns {Hex | undefined}
   */
  getHexOrUndefined(coords) {
    return this.hexes.find((h) => h.coords.q === coords.q && h.coords.r === coords.r);
  }

  /**
   * @param {Coord} coord
   * @returns {Hex}
   */
  getHex(coord) {
    const hex = this.getHexOrUndefined(coord);
    if (hex === undefined) {
      throw new Error(`coord not found ${JSON.stringify(coord)}`);
    }
    return hex;
  }
}
