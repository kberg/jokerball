const State = {
  ROLL: 'roll',
  SELECT_CHECKER: 'select-checker',
  MOVE_CHECKER: 'move-checker',
  MOVE_BALL: 'move-ball',
  END: 'end',
};

class Game {
  constructor() {
    this.grid = new Grid(6);
    this.ball = coords(0, 0);
    this.grid.getHex(this.ball).occupied = Occupied.BALL;
    this.player = 0;
    this.checkerDie = -1;
    this.ballDie = -1;
    this.state = State.ROLL;
    this.selectableSpaces = [];
    this.cb = () => undefined;

    const redCheckers = [
        ...range(-5, 1).map((q) => coords(q, 4)),
        ...range(-5, 0).map((q) => coords(q, 5))
    ];
    for (const checker of redCheckers) {
      this.grid.getHex(checker).occupied = Occupied.RED;
    }

    const blueCheckers = [
      ...range(0, 5).map((q) => coords(q, -5)),
      ...range(-1, 5).map((q) => coords(q, -4))
    ];
    for (const checker of blueCheckers) {
      this.grid.getHex(checker).occupied = Occupied.BLUE;
    }

    this.players = ['red', 'blue'];

    this.#buildWalls();
    this.#buildGoals();
  }

  /**
   * Register a callback that receives the new game. The owner of this callback is expected
   * to update the game state.
   *
   * @param {Function(Game): void} cb
   */
  register(cb) {
    this.cb = cb;
  }

  /**
   * Start the game. For now this just calls the callback to render results.
   */
  start() {
    this.cb(this);
  }

  #buildWalls() {
    // northwest top
    let c = coords(-1, -5);
    for (let idx = 0; idx < 5; idx++) {
      this.grid.getHex(c).type = HexType.WALL;
      c = c.neighbor(Direction.SW);
    }
    for (let idx = 0; idx < 6; idx++) {
      this.grid.getHex(c).type = HexType.WALL;
      c = c.neighbor(Direction.SE);
    }

    // Northeast
    c = coords(6, -5);
    for (let idx = 0; idx < 5; idx++) {
      this.grid.getHex(c).type = HexType.WALL;
      c = c.neighbor(Direction.SE);
    }
    for (let idx = 0; idx < 6; idx++) {
      this.grid.getHex(c).type = HexType.WALL;
      c = c.neighbor(Direction.SW);
    }
  }

  #buildGoals() {
    // Top
    for (let q = 0; q <= 6; q++) {
      const c = coords(q, -6);
      this.grid.getHex(c).type = HexType.GOAL;
    }
    // bottom
    for (let q = -6; q <= 0; q++) {
      const c = coords(q, 6);
      this.grid.getHex(c).type = HexType.GOAL;
    }
  }

  #setSelectableCheckers() {
    const player = this.players[this.player];
    this.selectableSpaces = this.grid.hexes.filter((hex) => {
      if (hex.occupied !== player) {
        return false;
      }
      return this.#getCheckerDestinations(hex).length > 0;s
    }).map((hex) => hex.idx);
  }

  /**
   * Moves up to `this.checkerDie` spaces to find a valid space in that direction.
   *
   * @param {Hex} hex the start space.
   * @param {Direction} direction
   * @param {boolean} forward if true, this is one of the two forward declarations. Cannot be a capture move.
   * @returns {Hex | undefined}
   */
  #checkDirection(hex, direction, forward) {
    let accum = hex;
    let prior = accum;
    for (let distance = 1; distance <= this.checkerDie; distance++) {
      accum = this.grid.getHexOrUndefined(prior.coords.neighbor(direction));
      if (accum === undefined) {
        return undefined;
      }

      // In any direction, if the checker is the opponent, it's a destination.
      if (accum.occupied !== undefined && accum.occupied !== Occupied.BALL && accum.occupied !== hex.occupied) {
        return accum;
      }
      if (forward) {
        if (accum.type === HexType.GOAL) {
          return accum;
        }
        if (accum.type === HexType.WALL) {
          return prior;
        }
        if (accum.occupied !== undefined) {
          return prior;
        }
      }
      if (accum.occupied !== undefined || accum.type === HexType.GOAL) {
        // Moving non-forward encoutering something besides an opponent makes it an invalid move.
        return undefined;
      }
      prior = accum;
    }
    if (forward) {
      return accum;
    }
    return undefined;
  }

  /**
   * Get all the hexes the checker at `origin` can navigate to.
   *
   * In each direction the checker can move as far as `this.checkerDie`
   *
   * @param {Hex} origin
   * @returns {Array<number>}
   */
  #getCheckerDestinations(origin) {
    const forwardDirections = this.player === 0 ? [Direction.NE, Direction.NW] : [Direction.SW, Direction.SE];

    const destinations = [];

    for (const dir of Object.values(Direction)) {
      const destination = this.#checkDirection(origin, dir, forwardDirections.includes(dir));
      if (destination !== undefined && destination.idx !== origin.idx) {
        destinations.push(destination.idx);
      }
    }

    return destinations;
  }

  #getBallDestinations() {
    // (this.ballDie - 1) corresponds with Direction.
    const destinations = [];
    let current = this.grid.getHex(this.ball);

    while (true) {
      const next = this.grid.getHex(current.coords.neighbor(this.ballDie - 1));
      if (next.type === HexType.GOAL) {
        destinations.push(next.idx);
        break;
      }
      if (next.type === HexType.WALL) {
        break;
      }
      if (next.occupied !== undefined) {
        break;
      }
      destinations.push(next.idx);
      current = next;
    }
    return destinations;
  }

  #moveChecker(destinationHex) {
    const srcHex = this.grid.hexes[this.selectedChecker];

    // Move occupied reference, unless it's a checker going out of a goal.
    if (destinationHex.type !== HexType.GOAL) {
      destinationHex.occupied = srcHex.occupied;
    }
    srcHex.occupied = undefined;

    // Reset selection
    this.selectedChecker = undefined;
  }

  #moveBall(destinationHex) {
    const srcHex = this.grid.getHex(this.ball);

    // Move occupied reference
    destinationHex.occupied = srcHex.occupied;
    srcHex.occupied = undefined;

    this.ball = destinationHex.coords;
  }

  spaceSelected(idx) {
    const hex = this.grid.hexes[idx];
    switch (this.state) {
      case State.SELECT_CHECKER:
        this.selectedChecker = idx;
        this.state = State.MOVE_CHECKER;
        this.selectableSpaces = this.#getCheckerDestinations(hex);
        break;

        case State.MOVE_CHECKER:
        this.#moveChecker(hex);
        this.state = State.MOVE_BALL;
        this.selectableSpaces = this.#getBallDestinations();
        break;

      case State.MOVE_BALL:
        this.#moveBall(hex);
        this.selectableSpaces = [];
        if (hex.type === HexType.GOAL) {
          this.state = State.END;
          break;
        }

        this.player = (this.player + 1) % 2;
        this.state = State.ROLL;
        break;
    }

    this.cb(this);
  }

  unselect() {
  switch (this.state) {
      case State.MOVE_CHECKER:
      // case State.MOVE_BALL: // MOVE_BALL could work if the entire grid's state was saved.
        this.state = State.SELECT_CHECKER;
        this.selectedChecker = undefined;
        this.#setSelectableCheckers();
        this.cb(this);
        break;
    }
  }

  okPressed() {
    switch (this.state) {
    case State.ROLL:
      this.checkerDie = Math.floor(Math.random() * 6) + 1;
      this.ballDie = Math.floor(Math.random() * 6) + 1;
      this.state = State.SELECT_CHECKER;
      this.#setSelectableCheckers();
      break;

    case State.SELECT_CHECKER:
      if (this.selectableSpaces.length === 0) {
        this.state = State.MOVE_BALL;
        this.selectableSpaces = this.#getBallDestinations();
      } else {
        throw new Error('Not valid to press OK when there are selectable checkers');
      }
      break;

      case State.MOVE_CHECKER:
      throw new Error('Cannot happen');

      case State.MOVE_BALL:
      if (this.selectableSpaces.length === 0) {
        this.player = (this.player + 1) % 2;
        this.state = State.ROLL;
      } else {
        throw new Error('Not valid to press OK when there are selectable checkers');
      }
      break;

      case State.END:
        window.alert('TODO create new game?');
    }
    this.cb(this);
  }
}

