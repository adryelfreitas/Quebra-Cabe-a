document.addEventListener('DOMContentLoaded', () => {
    const puzzleContainer = document.getElementById('puzzle-container');
    const puzzleBoard = document.getElementById('puzzle-board');
    const resetButton = document.getElementById('reset-button');
    const matueMusicPlayer = document.getElementById('matue-music');

    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevSongBtn = document.getElementById('prev-song-btn');
    const nextSongBtn = document.getElementById('next-song-btn');

    const winScreen = document.getElementById('win-screen');
    const playAgainBtn = document.getElementById('play-again-btn');

    const timerDisplay = document.getElementById('timer');
    const movesDisplay = document.getElementById('moves');

    const currentSongTitleDisplay = document.getElementById('current-song-title');
    const previewImage = document.getElementById('full-puzzle-preview');
    const imageModal = document.getElementById('image-modal');
    const amplifiedImage = document.getElementById('img-ampliada');
    const closeModalBtn = document.querySelector('.close-modal');

    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeModalHelpBtn = document.querySelector('.close-modal-help');


    const correctPieceSound = new Audio('som_peca_correta.mp3');
    correctPieceSound.volume = 0.2;

    const winSound = new Audio('som_vitoria.mp3');
    winSound.volume = 0.5;


    const puzzleImages = [
        'gato_quadrado.jpg',
        'gato_2.jpg',
        'gato_3.jpg',
        // NOVAS IMAGENS DO HOMEM-ARANHA MILES MORALES (adicione aqui!)
        'miles_morales_top.jpg', // Adicione esta linha (e ajuste o nome se for diferente)
        // 'miles_morales_2.jpg', // Se tiver mais, adicione aqui
        // 'miles_morales_3.jpg', // E aqui
    ];

    const matueSongs = [
        { name: '333', file: 'matue_333.mp3' },
        { name: 'Imagina esse Cenário', file: 'matue_imagina_cenario.mp3' },
        { name: 'Isso é Sério', file: 'matue_isso_e_serio.mp3' },
        // NOVAS MÚSICAS (adicione aqui!)
        { name: 'Sunflower', file: 'post_malone_sunflower.mp3' }, // Adicione esta linha
        { name: 'Pretty Little Girl', file: 'teto_pretty_little_girl.mp3' }, // Adicione esta linha
        { name: 'Estresse', file: 'alee_estresse.mp3' }, // Adicione esta linha
    ];

    let currentSongIndex = 0;

    let gridSize = 8; // Dificuldade padrão: Médio (8x8)
    const totalImageDimension = 480; // A largura/altura total da imagem cortada para o puzzle (px)

    let totalPieces;
    let pieceSize;

    let pieces = [];
    let currentDragPiece = null;
    let currentImageUrl = '';

    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let moves = 0;


    // Funções de controle da playlist de música (mantidas)
    function playSong(index) {
        if (matueSongs.length === 0) {
            console.log("Nenhuma música configurada para tocar.");
            currentSongTitleDisplay.textContent = 'Música: Nenhuma';
            return;
        }
        currentSongIndex = index;
        matueMusicPlayer.src = matueSongs[currentSongIndex].file;
        currentSongTitleDisplay.textContent = `Música: ${matueSongs[currentSongIndex].name}`;

        matueMusicPlayer.play()
            .then(() => {
                playPauseBtn.textContent = '⏸';
            })
            .catch(e => {
                console.error("Erro ao tentar tocar música:", e);
            });
    }

    function playNextSong() {
        currentSongIndex = (currentSongIndex + 1) % matueSongs.length;
        playSong(currentSongIndex);
    }

    function playPreviousSong() {
        currentSongIndex = (currentSongIndex - 1 + matueSongs.length) % matueSongs.length;
        playSong(currentSongIndex);
    }

    function togglePlayPause() {
        if (matueMusicPlayer.paused) {
            matueMusicPlayer.play()
                .then(() => {
                    playPauseBtn.textContent = '⏸';
                })
                .catch(e => console.log("Erro ao tentar retomar música:", e));
        } else {
            matueMusicPlayer.pause();
            playPauseBtn.textContent = '▶';
        }
    }

    playPauseBtn.addEventListener('click', togglePlayPause);
    prevSongBtn.addEventListener('click', playPreviousSong);
    nextSongBtn.addEventListener('click', playNextSong);
    matueMusicPlayer.addEventListener('ended', playNextSong);

    // Funções para o cronômetro (mantidas)
    function startTimer() {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(function printTime() {
            elapsedTime = Date.now() - startTime;
            let minutes = Math.floor(elapsedTime / 60000);
            let seconds = Math.floor((elapsedTime % 60000) / 1000);
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        elapsedTime = 0;
        timerDisplay.textContent = '00:00';
    }

    // Função para atualizar os estilos da grade e das peças (mantida)
    function updatePuzzleStyles() {
        pieceSize = totalImageDimension / gridSize;
        totalPieces = gridSize * gridSize;

        document.documentElement.style.setProperty('--grid-size', gridSize);
        document.documentElement.style.setProperty('--piece-size', `${pieceSize}px`);
        document.documentElement.style.setProperty('--total-puzzle-dim', `${totalImageDimension}px`);
        
        const containerWidth = (gridSize * pieceSize) + ((gridSize - 1) * 2) + (2 * 5); // Peças + gaps + padding
        puzzleContainer.style.width = `${containerWidth}px`;
        puzzleContainer.style.height = `${containerWidth}px`;
        puzzleBoard.style.width = `${containerWidth}px`;
        puzzleBoard.style.height = `${containerWidth}px`;

        puzzleContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${pieceSize}px)`;
        puzzleContainer.style.gridTemplateRows = `repeat(${gridSize}, ${pieceSize}px)`;
        puzzleBoard.style.gridTemplateColumns = `repeat(${gridSize}, ${pieceSize}px)`;
        puzzleBoard.style.gridTemplateRows = `repeat(${gridSize}, ${pieceSize}px)`;

        document.querySelectorAll('.puzzle-piece').forEach(piece => {
            piece.style.backgroundSize = `${totalImageDimension}px ${totalImageDimension}px`;
        });
    }

    // 1. Criar as peças do quebra-cabeça (mantida)
    function createPuzzlePieces() {
        currentImageUrl = puzzleImages[Math.floor(Math.random() * puzzleImages.length)];
        document.getElementById('full-puzzle-preview').src = currentImageUrl;

        puzzleContainer.innerHTML = '';
        pieces = [];

        for (let i = 0; i < totalPieces; i++) {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.setAttribute('data-index', i);

            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            piece.style.backgroundImage = `url(${currentImageUrl})`;
            piece.style.backgroundPosition = `-${col * pieceSize}px -${row * pieceSize}px`;
            piece.style.width = `${pieceSize}px`;
            piece.style.height = `${pieceSize}px`;

            piece.setAttribute('draggable', true);
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('dragend', handleDragEnd);

            pieces.push(piece);
        }
        shufflePieces();
        pieces.forEach(piece => puzzleContainer.appendChild(piece));
    }

    // 2. Criar os espaços no tabuleiro (mantida)
    function createPuzzleBoardSlots() {
        puzzleBoard.innerHTML = '';
        for (let i = 0; i < totalPieces; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.setAttribute('data-index', i);

            slot.style.width = `${pieceSize}px`;
            slot.style.height = `${pieceSize}px`;

            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
            puzzleBoard.appendChild(slot);
        }
    }

    // 3. Embaralhar as peças (mantida)
    function shufflePieces() {
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = pieces[i];
            pieces[i] = pieces[j];
            pieces[j] = temp;
        }
    }

    // 4. Funções para o arrastar e soltar (mantidas)
    function handleDragStart(event) {
        currentDragPiece = event.target;
        event.dataTransfer.setData('text/plain', event.target.dataset.index);
        setTimeout(() => {
            event.target.classList.add('hide');
            currentDragPiece.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(event) {
        event.target.classList.remove('hide');
        currentDragPiece.classList.remove('dragging');
        document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
            slot.classList.remove('droptarget');
        });
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDragEnter(event) {
        event.preventDefault();
        const targetSlot = event.target.closest('.puzzle-slot');
        if (targetSlot && !targetSlot.children.length) {
            if (parseInt(currentDragPiece.dataset.index) === parseInt(targetSlot.dataset.index)) {
                targetSlot.classList.add('droptarget');
            }
        }
    }

    function handleDragLeave(event) {
        const targetSlot = event.target.closest('.puzzle-slot');
        if (targetSlot) {
            targetSlot.classList.remove('droptarget');
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const droppedPieceIndex = event.dataTransfer.getData('text/plain');
        const droppedPiece = document.querySelector(`.puzzle-piece[data-index="${droppedPieceIndex}"]`);
        const targetSlot = event.target.closest('.puzzle-slot');

        if (targetSlot) {
            targetSlot.classList.remove('droptarget');
        }

        if (targetSlot && !targetSlot.children.length) {
            if (parseInt(droppedPiece.dataset.index) === parseInt(targetSlot.dataset.index)) {
                targetSlot.appendChild(droppedPiece);
                droppedPiece.classList.add('placed');
                droppedPiece.style.cursor = 'default';
                moves++;
                movesDisplay.textContent = moves;
                correctPieceSound.play().catch(e => console.log("Erro ao tocar som de peça correta:", e));
                checkWin();
            }
        }
    }

    // 5. Verificar vitória (mantida)
    function checkWin() {
        const placedPieces = Array.from(puzzleBoard.children);
        const isSolved = placedPieces.every(slot => {
            if (slot.children.length > 0) {
                const piece = slot.children[0];
                return parseInt(piece.dataset.index) === parseInt(slot.dataset.index);
            }
            return false;
        });

        if (isSolved) {
            stopTimer();
            const confettiCanvas = document.createElement('canvas');
            confettiCanvas.style.position = 'fixed';
            confettiCanvas.style.top = '0';
            confettiCanvas.style.left = '0';
            confettiCanvas.style.width = '100vw';
            confettiCanvas.style.height = '100vh';
            confettiCanvas.style.zIndex = '1001';
            document.body.appendChild(confettiCanvas);
            
            const confetti = window.confetti.create(confettiCanvas, {
                resize: true,
                useWorker: true
            });
            
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 }
            });
            
            setTimeout(() => {
                document.body.removeChild(confettiCanvas);
            }, 5000);

            winScreen.classList.remove('hidden');
            matueMusicPlayer.pause();
            playPauseBtn.textContent = '▶';
            winSound.play().catch(e => console.log("Erro ao tocar som de vitória:", e));
        }
    }

    // 6. Reiniciar o jogo (mantida)
    resetButton.addEventListener('click', () => {
        initGame();
        winScreen.classList.add('hidden');
        imageModal.classList.add('hidden');
        helpModal.classList.add('hidden');
    });

    playAgainBtn.addEventListener('click', () => {
        winScreen.classList.add('hidden');
        initGame();
    });

    // Lógica para a Modal de Imagem Ampliada (mantida)
    previewImage.addEventListener('click', () => {
        amplifiedImage.src = previewImage.src;
        imageModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        imageModal.classList.add('hidden');
    });

    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            imageModal.classList.add('hidden');
        }
    });

    // Lógica para a Modal de Instruções/Ajuda (mantida)
    helpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    closeModalHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });

    helpModal.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

    // Funções de seleção de dificuldade (mantidas)
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const difficultyButtons = [easyBtn, mediumBtn, hardBtn];

    difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            gridSize = parseInt(event.target.dataset.gridsize);
            
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            initGame();
        });
    });

    // 7. Iniciar (ou reiniciar) o jogo (mantida)
    function initGame() {
        updatePuzzleStyles();
        
        createPuzzlePieces();
        createPuzzleBoardSlots();
        
        matueMusicPlayer.volume = 0.05;

        if (matueSongs.length > 0) {
            playSong(currentSongIndex);
        } else {
            currentSongTitleDisplay.textContent = 'Música: Nenhuma';
        }

        resetTimer();
        startTimer();
        moves = 0;
        movesDisplay.textContent = moves;

        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        if (gridSize === 6) easyBtn.classList.add('active');
        else if (gridSize === 8) mediumBtn.classList.add('active');
        else if (gridSize === 10) hardBtn.classList.add('active');
    }

    // Inicia o jogo automaticamente quando a página é carregada
    initGame();
});