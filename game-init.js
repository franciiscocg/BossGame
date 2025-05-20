document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    window.gameRunning = true;
    window.frameCount = 0;
    window.keys = {
        KeyA: false,
        KeyD: false,
        KeyW: false,
        KeyS: false,
        Space: false,
        Shift: false
    };
    window.mouseX = 0;
    window.mouseY = 0;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    if (!canvas || !ctx) {
        console.error('No se pudo obtener el canvas o el contexto 2D');
        return;
    }

    // Configurar el tamaño del canvas
    canvas.width = 800;
    canvas.height = 600;

    // Crear personajes
    const player = new Character(100, 250, 30, 50, '#00ff00');
    const enemy = new Character(600, 250, 30, 100, '#ff0000');

    // Hacer el contexto global para que sea accesible en otros archivos
    window.ctx = ctx;
    window.canvas = canvas;
    window.player = player;
    window.enemy = enemy;

    // Iniciar el juego
    requestAnimationFrame(gameLoop);
});
