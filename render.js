const $ = function( id ) { return document.getElementById( id ); };

/**
 * Unicode characters for the six cardinal directions, ordered to match the `Direction` enum.
 * E, NE, NW, W, SW, SE, matching 1:1 the values in `Direction`
 */
const DIRECTION_CHARS = [
    '&rarr;', '&nearr;', '&nwarr;', '&larr;', '&swarr;', '&searr;'
  // '→', '↗', '↖', '←', '↙', '↘'
];

// window.onerror = function (message, source, lineno, colno, error) {
//   window.alert(message);
//   console.error("Error:", message, "at", source, "line", lineno, "column", colno, "Error object:", error);
//   // Returning true prevents the default browser error handling (e.g., console logging)
//   return true;
// };

function hexToElement(hex) {
  const hexElement = document.createElement('div');
  const coord = hex.coords;
  hexElement.className = 'hex';
  hexElement.dataset.q = coord.q;
  hexElement.dataset.r = coord.r;
  hexElement.dataset.s = coord.s;
  hexElement.dataset.idx = hex.idx;

  const size = 27;

  const height = 1.732 * size; /* √3 * size */
  const width = size;

  const left = 350 + ((coord.q -coord.s) * width);
  const top = 400 + (coord.r * height);
  const style = hexElement.style;
  style.left = `${left}px`;
  style.top = `${top}px`;

  const child = document.createElement('div');
  const DEBUG = undefined;
  if (DEBUG) {
    child.innerHTML = `(${coord.q}, ${coord.r}, ${coord.s})<br>${hex.idx}`;
  }
  hexElement.append(child);

  return hexElement;
}

document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = $('hex-grid');

  const game = new Game();
  game.grid.hexes.forEach(hex => {
    const hexElement = hexToElement(hex);
    hexElement.onclick = () => {
      const idx = Number(hexElement.dataset.idx);
      if (game.selectableSpaces.includes(idx)) {
        game.spaceSelected(idx)
      }
    }
    gridContainer.appendChild(hexElement);
  });

  $('rollButton').onclick = () => {
    game.roll();
  };
  $('okButton').onclick = () => {
    game.okPressed();
  };

  game.register(() => {
    drawState(game);
  });
  game.start();
});

/**
 * @param {number} idx
 */
function setSelectableSpace(idx) {
  const gridContainer = $('hex-grid');
  const hexElement = gridContainer.children[idx];
  if (hexElement === undefined) {
    throw new Error(`Invalid index ${idx}`);
  }
  hexElement.classList.add('selectable');
}

function getSummary(game) {
  switch (game.state) {
  case State.ROLL:
    return 'Roll the dice.';
  case State.SELECT_CHECKER:
    return 'Select a checker to move.';
  case State.MOVE_CHECKER:
    return 'Select the destination.';
  case State.MOVE_BALL:
    return 'Select where to move the ball.';
  case State.END:
    return 'Goal! Game over.';
  default:
    return state;
  }
}

function noSelectedCheckers(game) {
}

function renderSelection(game) {
  if (game.selectableSpaces.length === 0) {
    $('noaction').style.display = 'block';
    switch (game.state) {
    case State.ROLL:
    case State.END:
      $('noaction').style.display = 'none';
      break;
    case State.SELECT_CHECKER:
      $('noaction-text').textContent = 'No available checkers to move';
      break;
    case State.MOVE_CHECKER:
      $('noaction-text').textContent = 'No valid destinations for your checker';
      break;
    case State.MOVE_BALL:
      $('noaction-text').textContent = 'No valid destinations for the ball';
      break;
    }
  } else {
    $('noaction').style.display = 'none';
    for (const hex of game.selectableSpaces) {
      setSelectableSpace(hex);
    }
  }
}

/**
 * @param {Game} game
 */
function drawState(game) {
  for (const hex of game.grid.hexes) {
    const hexElement = $('hex-grid').children[hex.idx];
    hexElement.classList = "hex"; // Resets selection

    switch(hex.type) {
    case HexType.GOAL:
      hexElement.classList.add('type-goal');
      // if (hex.coords.r === -6) {
      //   hexElement.classList.add('border-n');
      // } else {
      //   hexElement.classList.add('border-s');
      // }
      break;
    case HexType.WALL:
      hexElement.classList.add('type-wall');
      // if (hex.coords.s === 6) {
      //   hexElement.classList.add('border-nw');
      // } else if (hex.coords.s === -6) {
      //   hexElement.classList.add('border-se');
      // } else {
      //   hexElement.classList.add('border-s');
      // }
      break;
    case HexType.PLAY_AREA:
      break;
    default:
      throw new Error('unknown hex type ' + hex.type);
    }
    const child = hexElement.children[0];
    child.className = "";
    switch (hex.occupied) {
    case Occupied.RED:
    case Occupied.BLUE:
    case Occupied.BALL:
      child.classList.add('disc');
      child.classList.add(hex.occupied);
      break;
    case Occupied.EMPTY:
      break;
    default:
      throw new Error('unknown occupied value ' + hex.occupied);
    }
  }

  const playerColor = game.players[game.player].color;
  $('turn').textContent = playerColor;
  $('turn').style.color = playerColor;
  $('roll').style.display = game.state === State.ROLL ? 'inline' : 'none';
  $('dice').style.display = (game.state === State.ROLL || game.state === State.END) ? 'none' : 'inline';
  $('checker-die').textContent = game.checkerDie;
  $('ball-die').innerHTML = game.ballDie  + ' ' + DIRECTION_CHARS[game.ballDie - 1];
  $('message').textContent = getSummary(game);
  renderSelection(game);
}
