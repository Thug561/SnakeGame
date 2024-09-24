class Game {
    constructor() {
        this.snake = new Snake();
        this.food = new Food();
        this.portalFood = null;
        this.gui = new GUI();
        this.walls = [];
        this.isPlaying = false;
        this.mode = 'classic';
        this.speed = 200;
        this.bestScore = 0;
        this.currentScore = 0;
        this.gameInterval = null;
        this.bestScore = this.getBestScore();

        this.setupInput();
        this.createGameField();
    }
    getBestScore() {
        const bestScore = localStorage.getItem('bestScore');
        return bestScore ? parseInt(bestScore, 10) : 0;
    }

    setBestScore(score) {
        localStorage.setItem('bestScore', score);
    }
    createGameField() {
        this.gameContainer = document.getElementById('game-container');
        this.gameContainer.style.position = 'relative';
        this.gameContainer.style.width = '400px';
        this.gameContainer.style.height = '400px';
        this.gameContainer.style.border = '2px solid #333';
        this.gameContainer.style.backgroundColor = '#fff';
        this.snakeElements = [];
        this.foodElement = document.createElement('div');
        this.foodElement.style.position = 'absolute';
        this.foodElement.style.width = '20px';
        this.foodElement.style.height = '20px';
        this.foodElement.style.backgroundColor = 'red';
        this.gameContainer.appendChild(this.foodElement);
    }

    render() {
        this.snakeElements.forEach(el => el.remove());
        this.snakeElements = [];

        this.snake.body.forEach(segment => {
            const segmentElement = document.createElement('div');
            segmentElement.style.position = 'absolute';
            segmentElement.style.width = '20px';
            segmentElement.style.height = '20px';
            segmentElement.style.backgroundColor = 'green';
            segmentElement.style.left = `${segment.x * 20}px`;
            segmentElement.style.top = `${segment.y * 20}px`;
            this.gameContainer.appendChild(segmentElement);
            this.snakeElements.push(segmentElement);
        });

        this.foodElement.style.left = `${this.food.position.x * 20}px`;
        this.foodElement.style.top = `${this.food.position.y * 20}px`;

        if (this.mode === 'walls') {
            this.walls.forEach(wall => {
                const wallElement = document.createElement('div');
                wallElement.style.position = 'absolute';
                wallElement.style.width = '20px';
                wallElement.style.height = '20px';
                wallElement.style.backgroundColor = 'black';
                wallElement.style.left = `${wall.position.x * 20}px`;
                wallElement.style.top = `${wall.position.y * 20}px`;
                this.gameContainer.appendChild(wallElement);
            });
        }
        if (this.mode === 'portal') {
            this.foodElement1 = document.createElement('div');
            this.foodElement1.style.position = 'absolute';
            this.foodElement1.style.width = '20px';
            this.foodElement1.style.height = '20px';
            this.foodElement1.style.backgroundColor = 'purple';
            this.foodElement1.style.left = `${this.portalFood.position1.x * 20}px`;
            this.foodElement1.style.top = `${this.portalFood.position1.y * 20}px`;
            this.gameContainer.appendChild(this.foodElement1);

            this.foodElement2 = document.createElement('div');
            this.foodElement2.style.position = 'absolute';
            this.foodElement2.style.width = '20px';
            this.foodElement2.style.height = '20px';
            this.foodElement2.style.backgroundColor = 'purple';
            this.foodElement2.style.left = `${this.portalFood.position2.x * 20}px`;
            this.foodElement2.style.top = `${this.portalFood.position2.y * 20}px`;
            this.gameContainer.appendChild(this.foodElement2);
        }
    }


    setupInput() {
        document.addEventListener('keydown', (e) => this.snake.changeDirection(e));
    }

    startGame() {
        this.snake = new Snake();
        this.walls = [];
        this.currentScore = 0;
        this.speed = 200;

        this.gui.updateScore(this.currentScore, this.bestScore);
        this.gui.updateButtons('playing');

        this.food = new Food();
        if (this.mode === 'portal') {
            this.portalFood = new PortalFood();
        } else {
            this.portalFood = null;
        }

        this.gameContainer.innerHTML = '';
        this.createGameField();

        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }

        this.gameInterval = setInterval(() => this.gameLoop(), this.speed);
        this.isPlaying = true;
        this.render();
    }




    gameLoop() {
        this.snake.move(this.mode);
        this.checkCollisions();
        this.updateGUI();
        this.render();
    }


    checkCollisions() {
        const head = this.snake.body[0];

        if (this.mode !== 'god') {
            if (head.x < 0 || head.y < 0 || head.x >= 20 || head.y >= 20 || this.snakeCollision()) {
                this.stopGame();
                return;
            }
        }

        if (this.mode === 'portal') {
            if (head.x === this.portalFood.position1.x && head.y === this.portalFood.position1.y) {
                this.teleportSnake(this.portalFood.position2);
            } else if (head.x === this.portalFood.position2.x && head.y === this.portalFood.position2.y) {
                this.teleportSnake(this.portalFood.position1);
            }
        }

        if (this.mode !== 'god' && this.mode === 'walls') {
            if (this.wallCollision(head)) {
                this.stopGame();
                return;
            }
        }

        if (head.x === this.food.position.x && head.y === this.food.position.y) {
            this.snake.grow();
            this.food.respawn();

            if (this.currentScore + 1 > this.bestScore) {
                this.bestScore = this.currentScore + 1;
                this.setBestScore(this.bestScore);
            }

            if (this.mode === 'walls') {
                this.spawnWall();
            }

            if (this.mode === 'portal') {
                this.portalFood.respawn();
            }

            this.currentScore += 1;

            if (this.mode === 'speed') {
                this.speed *= 0.9;
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.gameLoop(), this.speed);
            }
        }
    }


    teleportSnake(newPosition) {
        const head = this.snake.body[0];
        this.snake.body[0] = { ...newPosition };
    }


    spawnWall() {
        const newWall = new Walls(this.snake, this.food);
        this.walls.push(newWall);
    }

    wallCollision(head) {
        return this.walls.some(wall => wall.position.x === head.x && wall.position.y === head.y);
    }

    snakeCollision() {
        const [head, ...body] = this.snake.body;
        return body.some(segment => segment.x === head.x && segment.y === head.y);
    }

    updateGUI() {
        this.gui.updateScore(this.currentScore, this.bestScore);
    }

    stopGame() {
        clearInterval(this.gameInterval);
        this.isPlaying = false;
        this.gui.updateButtons('not-playing');
    }
}

class Walls {
    constructor(snake, food) {
        this.snake = snake;
        this.food = food;
        this.position = this.randomPosition();
    }

    randomPosition() {
        let newPosition;
        do {
            newPosition = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
        } while (this.isOnSnake(newPosition) || this.isOnFood(newPosition));
        return newPosition;
    }

    isOnSnake(position) {
        return this.snake.body.some(segment => segment.x === position.x && segment.y === position.y);
    }

    isOnFood(position) {
        return position.x === this.food.position.x && position.y === this.food.position.y;
    }
}

class Snake {
    constructor() {
        this.body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        this.direction = { x: 1, y: 0 };
    }

    changeDirection(event) {
        switch (event.key) {
            case 'ArrowUp':
                if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
                if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
                if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
                if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
                break;
        }
    }

    move(gameMode) {
        const newHead = {
            x: this.body[0].x + this.direction.x,
            y: this.body[0].y + this.direction.y
        };

        if (gameMode === 'god') {
            if (newHead.x < 0) {
                newHead.x = 19;
            } else if (newHead.x >= 20) {
                newHead.x = 0;
            }

            if (newHead.y < 0) {
                newHead.y = 19;
            } else if (newHead.y >= 20) {
                newHead.y = 0;
            }
        }

        this.body.unshift(newHead);
        this.body.pop();
    }

    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ x: tail.x, y: tail.y });
    }
}

class Food {
    constructor() {
        this.position = this.randomPosition();
    }

    randomPosition() {
        return { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
    }

    respawn() {
        this.position = this.randomPosition();
    }
}

class PortalFood {
    constructor() {
        this.respawn();
    }

    randomPosition() {
        return { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
    }

    respawn() {
        this.position1 = this.randomPosition();
        this.position2 = this.randomPosition();

        while (this.position1.x === this.position2.x && this.position1.y === this.position2.y) {
            this.position2 = this.randomPosition();
        }
    }
}

class GUI {
    constructor() {
        this.bestScoreLabel = document.getElementById('bestScore');
        this.currentScoreLabel = document.getElementById('currentScore');
        this.menuButton = document.getElementById('menuButton');
        this.playButton = document.getElementById('playButton');
        this.exitButton = document.getElementById('exitButton');
        this.modeList = document.getElementById('modeList');
    }

    updateScore(currentScore, bestScore) {
        this.currentScoreLabel.textContent = `Current Score: ${currentScore}`;
        this.bestScoreLabel.textContent = `Best Score: ${bestScore}`;
    }

    updateButtons(state) {
        if (state === 'playing') {
            this.playButton.style.display = 'none';
            this.exitButton.style.display = 'none';
            this.menuButton.style.display = 'block';
        } else {
            this.playButton.style.display = 'block';
            this.exitButton.style.display = 'block';
            this.menuButton.style.display = 'none';
        }
    }
}

const game = new Game();
document.getElementById('playButton').addEventListener('click', () => game.startGame());
document.getElementById('exitButton').addEventListener('click', () => game.stopGame());
document.querySelectorAll('input[name="gameMode"]').forEach((input) => {
    input.addEventListener('change', (event) => {
        game.mode = event.target.value;
    });
});
