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
        'miles_morales_1.jpg',
    ];

    const matueSongs = [
        { name: '333', file: 'matue_333.mp3' },
        { name: 'Imagina esse Cenário', file: 'matue_imagina_cenario.mp3' },
        { name: 'Isso é Sério', file: 'matue_isso_e_serio.mp3' },
        { name: 'Sunflower', file: 'post_malone_sunflower.mp3' },
        { name: 'Pretty Little Girl', file: 'teto_pretty_little_girl.mp3' },
        { name: 'Estresse', file: 'alee_estresse.mp3' },
    ];

    let currentSongIndex = 0;

    let gridSize = 8; // Dificuldade padrão: Médio (8x8)
    const totalImageDimension = 480; // A largura/altura total da imagem cortada para o puzzle (px)

    let totalPieces;
    let pieceSize;

    let pieces = [];
    let currentDragPiece = null; // Para mouse drag
    let currentTouchPiece = null; // Para touch drag

    // Variáveis para touch drag
    let initialTouchX = 0;
    let initialTouchY = 0;
    let touchOffsetX = 0;
    let touchOffsetY = 0;


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

    // 1. Criar as peças do quebra-cabeça (Listeners para Mouse E Touch)
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

            // ----- LISTENERS PARA MOUSE DRAG & DROP -----
            piece.setAttribute('draggable', true); // Essencial para mouse drag
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('dragend', handleDragEnd);

            // ----- LISTENERS PARA TOUCH DRAG & DROP -----
            piece.addEventListener('touchstart', handleTouchStart, { passive: false });
            piece.addEventListener('touchmove', handleTouchMove, { passive: false });
            piece.addEventListener('touchend', handleTouchEnd);
            piece.addEventListener('touchcancel', handleTouchEnd); // Em caso de interrupção

            pieces.push(piece);
        }
        shufflePieces();
        pieces.forEach(piece => puzzleContainer.appendChild(piece));
    }

    // 2. Criar os espaços no tabuleiro (Listeners para Mouse Drag & Drop)
    function createPuzzleBoardSlots() {
        puzzleBoard.innerHTML = '';
        for (let i = 0; i < totalPieces; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.setAttribute('data-index', i);

            slot.style.width = `${pieceSize}px`;
            slot.style.height = `${pieceSize}px`;

            // ----- LISTENERS PARA MOUSE DRAG & DROP -----
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop); // drop do mouse

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

    // ----- FUNÇÕES DE DRAG & DROP PARA MOUSE (Adaptadas) -----
    function handleDragStart(event) {
        currentDragPiece = event.target;
        event.dataTransfer.setData('text/plain', event.target.dataset.index);
        // NOVO: Adiciona um estilo temporário para a peça arrastada para não sumir visualmente
        currentDragPiece.style.opacity = '0.7'; 
        currentDragPiece.classList.add('dragging'); // Para brilho/sombra
    }

    function handleDragEnd(event) {
        currentDragPiece.style.opacity = ''; // Remove o estilo temporário
        currentDragPiece.classList.remove('dragging'); // Remove brilho/sombra
        // Remove qualquer destaque de drop target que possa ter sobrado
        document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
            slot.classList.remove('droptarget');
        });
        currentDragPiece = null; // Reseta a peça arrastada
    }

    // Feedback visual para mouse (mantido)
    function handleDragOver(event) {
        event.preventDefault(); // Permite drop
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

    // LÓGICA DE COLOCAR A PEÇA NO LUGAR (FUNÇÃO AUXILIAR COMPARTILHADA)
    function placePiece(piece, targetSlot) {
        if (parseInt(piece.dataset.index) === parseInt(targetSlot.dataset.index)) {
            targetSlot.appendChild(piece);
            piece.classList.add('placed');
            piece.style.cursor = 'default';
            moves++;
            movesDisplay.textContent = moves;
            correctPieceSound.play().catch(e => console.log("Erro ao tocar som de peça correta:", e));
            checkWin();
            return true; // Peça colocada com sucesso
        }
        return false; // Peça não colocada
    }

    // FUNÇÃO DE DROP PARA MOUSE (Chama a função auxiliar)
    function handleDrop(event) {
        event.preventDefault();
        const droppedPieceIndex = event.dataTransfer.getData('text/plain');
        const droppedPiece = document.querySelector(`.puzzle-piece[data-index="${droppedPieceIndex}"]`);
        const targetSlot = event.target.closest('.puzzle-slot');

        if (targetSlot) {
            targetSlot.classList.remove('droptarget');
        }
        
        if (droppedPiece && targetSlot) { // Certifica-se de que há uma peça e um slot
            placePiece(droppedPiece, targetSlot);
        }
    }


    // ----- FUNÇÕES DE DRAG & DROP PARA TOUCH (Completamente Separadas) -----
    function handleTouchStart(event) {
        if (event.touches.length === 1) { // Apenas um dedo
            event.preventDefault(); // Previne rolagem/zoom da página
            currentTouchPiece = event.target;
            
            // Posiciona a peça para ser arrastada livremente
            currentTouchPiece.style.position = 'absolute';
            currentTouchPiece.style.zIndex = '200';
            currentTouchPiece.style.opacity = '0.7'; // Feedback visual
            currentTouchPiece.classList.add('dragging'); // Para brilho/sombra

            // Calcula o offset inicial (onde o dedo tocou na peça)
            const rect = currentTouchPiece.getBoundingClientRect();
            initialTouchX = event.touches[0].clientX;
            initialTouchY = event.touches[0].clientY;
            touchOffsetX = initialTouchX - rect.left;
            touchOffsetY = initialTouchY - rect.top;
        }
    }

    function handleTouchMove(event) {
        if (currentTouchPiece && event.touches.length === 1) {
            event.preventDefault(); // Previne rolagem/zoom da página
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;

            // Move a peça para seguir o dedo, ajustando pelo offset inicial
            currentTouchPiece.style.left = `${touchX - touchOffsetX}px`;
            currentTouchPiece.style.top = `${touchY - touchOffsetY}px`;

            // Feedback visual do slot alvo (simula dragenter/dragleave para touch)
            const targetSlot = getDropTargetForTouch(touchX, touchY);
            // Limpa o droptarget de todos os slots primeiro, exceto o atual
            document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
                if (slot !== targetSlot) slot.classList.remove('droptarget');
            });

            if (targetSlot && !targetSlot.children.length) {
                if (parseInt(currentTouchPiece.dataset.index) === parseInt(targetSlot.dataset.index)) {
                    targetSlot.classList.add('droptarget');
                }
            }
        }
    }

    function handleTouchEnd(event) {
        if (currentTouchPiece) {
            const touch = event.changedTouches[0]; // Pega a posição do toque final
            const targetSlot = getDropTargetForTouch(touch.clientX, touch.clientY); // Encontra o slot de destino

            // Limpa o droptarget de todos os slots que possam estar destacados
            document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
                slot.classList.remove('droptarget');
            });

            // Tenta colocar a peça no lugar
            const placed = (targetSlot && !targetSlot.children.length) ? placePiece(currentTouchPiece, targetSlot) : false;

            // Se a peça não foi colocada com sucesso, ou se foi solta fora de um slot válido
            if (!placed) {
                // Opcional: fazer a peça "voltar" visualmente à sua posição original
                // Para simplificar, apenas remove os estilos de arrasto:
                currentTouchPiece.style.position = '';
                currentTouchPiece.style.transform = ''; // Limpa qualquer transformação de arrasto
                currentTouchPiece.style.left = '';
                currentTouchPiece.style.top = '';
                currentTouchPiece.style.zIndex = '';
                currentTouchPiece.style.opacity = '';
                currentTouchPiece.classList.remove('dragging');
            } else {
                // Se foi colocada, os estilos já são manipulados por placePiece e suas classes
                currentTouchPiece.style.position = ''; // Remove o absoluto
                currentTouchPiece.style.left = '';
                currentTouchPiece.style.top = '';
                currentTouchPiece.style.zIndex = '';
                currentTouchPiece.style.opacity = '';
                currentTouchPiece.classList.remove('dragging');
            }
            currentTouchPiece = null; // Reseta a peça touch atual
        }
    }

    // NOVO: Função auxiliar para encontrar o slot de drop para eventos de toque
    function getDropTargetForTouch(x, y) {
        const slots = document.querySelectorAll('.puzzle-slot');
        for (let i = 0; i < slots.length; i++) {
            const rect = slots[i].getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return slots[i];
            }
        }
        return null;
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
        
        matueMusicPlayer.volume = 0.1;

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