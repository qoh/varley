function start() {
  pub.world = Array(WORLD_WIDTH * WORLD_HEIGHT).fill(-1)
}

function connect(player) {
  player.vx = 1, player.vy = 0
  player.x = Math.floor(Math.random() * WORLD_WIDTH)
  player.y = Math.floor(Math.random() * WORLD_HEIGHT)
}

let keys = { 'UP': [0, -1], 'LEFT': [-1, 0], 'RIGHT': [1, 0], 'DOWN': [0, 1] }
function press(player, key) {
  [player.vx, player.vy] = keys[key] || [player.vx, player.vy]
}

function playertick(player) {
  player.x = player.x + player.vx, player.y = player.y + player.vy

  if (player.x < 0 || player.y < 0 ||
    player.x >= WORLD_WIDTH || player.y >= WORLD_HEIGHT ||
    pub.world[player.x + player.y * WORLD_WIDTH] !== -1)
    return player.disconnect()

  pub.world[player.x + player.y * WORLD_WIDTH] = player.id
}

function disconnect(player) {
  pub.world = pub.world.map(t => t == player.id ? -1 : t)
}
