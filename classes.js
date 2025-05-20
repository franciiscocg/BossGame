// Clase Character
class Character {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 3;
        this.health = 100;
        this.isAttacking = false;
        this.isDefending = false;
        this.direction = 'right';
        this.combo = 0;
        this.maxCombo = 0;
        this.score = 0;
        this.isInvulnerable = false;
        this.invulnerabilityFrames = 0;
        this.bullets = [];
        this.projectiles = [];
        this.lastShotTime = 0;
        this.shotCooldown = 10;
        // Referencias globales para el ratón
        this.mouseX = window.mouseX || 0;
        this.mouseY = window.mouseY || 0;
    }

    draw(ctx) {
        ctx.save();
        if (this.isInvulnerable && this.invulnerabilityFrames % 10 < 5) {
            ctx.globalAlpha = 0.5;
        }
        this.bullets.forEach(bullet => bullet.draw(ctx));
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    moveLeft() {
        this.x -= this.speed;
        this.direction = 'left';
    }

    moveRight() {
        this.x += this.speed;
        this.direction = 'right';
    }

    moveUp() {
        this.y -= this.speed;
    }

    moveDown() {
        this.y += this.speed;
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) return;
        
        this.health = Math.max(0, this.health - amount);
        this.isInvulnerable = true;
        
        // Hacer al personaje invulnerable por 1 segundo (60 frames)
        setTimeout(() => {
            this.isInvulnerable = false;
        }, 1000);
        
        // Actualizar la barra de vida
        if (this === window.player) {
            const playerBar = document.getElementById('player-health-bar');
            if (playerBar) {
                playerBar.style.width = `${this.health}%`;
            }
        }
        
        return this.health > 0;
    }

    attack() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime >= 100) {
            this.isAttacking = true;
            // Guardar la posición del jugador al disparar
            this.lastAttackX = this.x + this.width/2;
            this.lastAttackY = this.y + this.height/2;
            
            const bullet = new Bullet(
                this.x + this.width/2, 
                this.y + this.height/2, 
                window.mouseX, 
                window.mouseY, 
                2, 
                '#00ff00',
                'player'
            );
            this.bullets.push(bullet);
            this.lastShotTime = currentTime;
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            this.score += 2;
            addLogEntry(`¡Disparo! - Combo: ${this.combo}x`, 'player', 2000);
            console.log('Disparo creado:', bullet);
        }
    }

    defend() {
        this.isDefending = true;
    }

    update() {
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.isDead) {
                this.bullets.splice(index, 1);
            } else if (bullet.checkHit(enemy)) {
                enemy.health -= bullet.damage;
                bullet.isDead = true;
                this.score += 5;
                addLogEntry(`¡Impacto! Daño: ${bullet.damage} - Salud enemigo: ${Math.round(enemy.health)}`, 'player', 2000);
            }
        });

        // Guardar la última posición del jugador
        window.lastPlayerX = this.x + this.width/2;
        window.lastPlayerY = this.y + this.height/2;

        if (this.isInvulnerable) {
            this.invulnerabilityFrames--;
            if (this.invulnerabilityFrames <= 0) {
                this.isInvulnerable = false;
            }
        }
    }


}

// Clase Bullet
class Bullet {
    constructor(x, y, targetX, targetY, damage, color, owner) {
        this.owner = owner; // 'player' o 'enemy'
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.color = color;
        this.size = 10;  // Aumentado de 3 a 10 píxeles
        this.isDead = false;
        
        // Calcular dirección hacia el objetivo
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Velocidad diferente según el dueño de la bala
        let speed;
        if (owner === 'player') {
            speed = 10;  // Velocidad para balas del jugador
        } else {
            speed = 4;   // Velocidad más lenta para balas del enemigo
        }
        
        this.speedX = dx / distance * speed;
        this.speedY = dy / distance * speed;
        
        console.log('Nueva bala:', {
            from: {x, y},
            to: {targetX, targetY},
            speed: {x: this.speedX, y: this.speedY},
            owner: this.owner
        });
    }

    isDead() {
        return this.isDead || 
               this.x < 0 || 
               this.x > window.canvas.width ||
               this.y < 0 || 
               this.y > window.canvas.height;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Verificar si la bala está fuera de la pantalla
        if (this.x < 0 || 
            this.x > window.canvas.width ||
            this.y < 0 || 
            this.y > window.canvas.height) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        console.log('Dibujando bala en:', this.x, this.y, 'Color:', this.color);
        
        // Dibujar círculo exterior (borde)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        // Dibujar círculo interior (color principal)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Dibujar línea de trayectoria (solo para depuración)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();
    }

    checkHit(target) {
        const hit = (
            this.x > target.x &&
            this.x < target.x + target.width &&
            this.y > target.y &&
            this.y < target.y + target.height
        );
        
        if (hit) {
            // Solo aplicar daño si el dueño de la bala es diferente al objetivo
            if ((this.owner === 'player' && target === window.enemy) ||
                (this.owner === 'enemy' && target === window.player)) {
                return true;
            }
        }
        return false;
    }
    
    isDead() {
        return this.x < -this.size || 
               this.x > window.canvas.width + this.size ||
               this.y < -this.size || 
               this.y > window.canvas.height + this.size;
    }
}


