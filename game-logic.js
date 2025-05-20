let gameRunning = true;
let frameCount = 0;
const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false,
    Shift: false
};
let mouseX = 0;
let mouseY = 0;

// Configurar eventos de teclado
document.addEventListener('keydown', (e) => {
    if (e.code in window.keys) {
        window.keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in window.keys) {
        window.keys[e.code] = false;
    }
});

// Configurar evento de movimiento del ratón
document.addEventListener('mousemove', (e) => {
    // Convertir coordenadas del documento a coordenadas del canvas
    const rect = window.canvas.getBoundingClientRect();
    window.mouseX = e.clientX - rect.left;
    window.mouseY = e.clientY - rect.top;
    console.log('Ratón:', window.mouseX, window.mouseY);
});

// Función de detección de colisiones
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Actualizar barras de salud
function updateHealthBars() {
    const playerBar = document.querySelector('.player-health .health-bar');
    const enemyBar = document.querySelector('.enemy-health .health-bar');
    
    if (playerBar && enemyBar) {
        playerBar.style.width = `${window.player.health}%`;
        enemyBar.style.width = `${window.enemy.health}%`;
    }
}

// Función para actualizar el log
function addLogEntry(message, type = 'info', duration = 5000) {
    const log = document.getElementById('log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    
    log.appendChild(entry);
    
    setTimeout(() => {
        entry.remove();
    }, duration);
}

// Actualizar UI
function updateUI() {
    const score = document.getElementById('score');
    const combo = document.getElementById('combo');
    
    if (score) score.textContent = `Puntuación: ${Math.floor(window.player.score)}`;
    if (combo) combo.textContent = `Combo: ${window.player.combo}x`;
}

// Game loop
// Game loop
function gameLoop() {
    if (!window.gameRunning) return;
    
    // Limpiar el canvas
    window.ctx.fillStyle = '#000';
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);

    // Actualizar balas del jugador
    window.player.bullets = window.player.bullets.filter(bullet => {
        bullet.update();
        return !bullet.isDead; // isDead es una propiedad, no un método
    });

    // Actualizar balas del enemigo y verificar colisiones con el jugador
    window.enemy.bullets = window.enemy.bullets.filter(bullet => {
        bullet.update();
        
        // Verificar colisión con el jugador
        if (bullet.checkHit(window.player)) {
            window.player.takeDamage(bullet.damage);
            addLogEntry(`¡Golpe recibido! -${bullet.damage} de vida`, 'damage');
            return false; // Eliminar la bala
        }
        
        return !bullet.isDead; // isDead es una propiedad, no un método
    });

    window.player.update();
    
    if (window.keys.KeyA) window.player.moveLeft();
    if (window.keys.KeyD) window.player.moveRight();
    if (window.keys.KeyW) window.player.moveUp();
    if (window.keys.KeyS) window.player.moveDown();
    if (window.keys.Space) window.player.attack();
    if (window.keys.Shift) window.player.defend();

    window.enemy.update();
    
    // Mover en X
    if (window.enemy.x < window.player.x) window.enemy.moveRight();
    else if (window.enemy.x > window.player.x) window.enemy.moveLeft();

    // Mover en Y
    if (window.enemy.y < window.player.y) window.enemy.moveDown();
    else if (window.enemy.y > window.player.y) window.enemy.moveUp();
    
    // Disparar cada 2 segundos (120 frames)
    console.log('Frame:', frameCount, 'Último disparo:', window.enemyLastShot, 'Diferencia:', frameCount - window.enemyLastShot);
    if (frameCount - window.enemyLastShot >= 60) {  // Reducido a 1 segundo para pruebas
        // El enemigo dispara una bala hacia la última posición del jugador
        // Calcular la posición objetivo absoluta
        const targetX = window.player.x + window.player.width/2;
        const targetY = window.player.y + window.player.height/2;
        
        const bullet = new Bullet(
            window.enemy.x + window.enemy.width/2, 
            window.enemy.y + window.enemy.height/2, 
            targetX, 
            targetY, 
            3, 
            '#ff3366',  // Color rosa brillante
            'enemy'    // Indicar que la bala es del enemigo
        );
        
        console.log('Disparo enemigo - Desde:', 
            {x: window.enemy.x + window.enemy.width/2, y: window.enemy.y + window.enemy.height/2}, 
            'Hacia:', {x: targetX, y: targetY}
        );
        window.enemy.bullets.push(bullet);
        window.enemyLastShot = frameCount;  // Actualizar el tiempo del último disparo
        console.log('Enemigo dispara a:', window.lastPlayerX, window.lastPlayerY, 'Balas:', window.enemy.bullets.length);
        
        if (checkCollision(window.enemy, window.player)) {
            if (!window.player.isDefending) {
                window.player.health -= 5;
                window.player.combo = 0;
                window.player.isInvulnerable = true;
                window.player.invulnerabilityFrames = 30;
            }
        }
    }

    if (window.player.isAttacking && window.player.attackCooldown === 0) {
        window.player.sword = null;
    }

    // Dibujar balas del jugador
    window.player.bullets.forEach(bullet => {
        console.log('Dibujando bala del jugador en:', bullet.x, bullet.y);
        bullet.draw(window.ctx);
    });

    // Dibujar balas del enemigo
    window.enemy.bullets.forEach(bullet => {
        console.log('Dibujando bala del enemigo en:', bullet.x, bullet.y);
        bullet.draw(window.ctx);
    });

    // Dibujar personajes
    window.player.draw(window.ctx);
    window.enemy.draw(window.ctx);

    updateHealthBars();
    updateUI();

    if (window.player.health <= 0 || window.enemy.health <= 0) {
        gameRunning = false;
        const result = window.enemy.health <= 0 ? '¡Victoria! Has derrotado al enemigo!' : '¡Derrota! Has sido derrotado';
        const message = `${result}\n\nPuntuación: ${Math.floor(window.player.score)}\nCombo máximo: ${window.player.maxCombo}x`;
        addLogEntry(message, window.enemy.health <= 0 ? 'player' : 'critical');
        addLogEntry('¡Juego terminado!', 'critical');
        alert(message);
    }

    frameCount++;
    requestAnimationFrame(gameLoop);
}
