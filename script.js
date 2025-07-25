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

    let gridSize = 8;
    const totalImageDimension = 480;

    let totalPieces;
    let pieceSize;

    let pieces = [];
    let currentDragPiece = null;
    let currentImageUrl = '';

    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let moves = 0;

    // NOVO: Variáveis para o Touch Drag & Drop
    let initialX = 0;
    let initialY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let currentTouchPiece = null;


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

    // 1. Criar as peças do quebra-cabeça (ADICIONAR EVENTOS DE TOUCH AQUI)
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

            // REMOVIDO: dragstart, dragend
            // ADICIONADO: Eventos de TOUCH para mobile
            piece.addEventListener('touchstart', handleTouchStart);
            piece.addEventListener('touchmove', handleTouchMove);
            piece.addEventListener('touchend', handleTouchEnd);
            piece.addEventListener('touchcancel', handleTouchEnd); // Em caso de interrupção

            // Mantido para compatibilidade com mouse/desktop (se não remover draggable=true)
            piece.setAttribute('draggable', true);
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('dragend', handleDragEnd);

            pieces.push(piece);
        }
        shufflePieces();
        pieces.forEach(piece => puzzleContainer.appendChild(piece));
    }

    // 2. Criar os espaços no tabuleiro (ADICIONAR EVENTOS DE TOUCH AQUI)
    function createPuzzleBoardSlots() {
        puzzleBoard.innerHTML = '';
        for (let i = 0; i < totalPieces; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.setAttribute('data-index', i);

            slot.style.width = `${pieceSize}px`;
            slot.style.height = `${pieceSize}px`;

            // REMOVIDO: dragover, dragenter, dragleave, drop
            // ADICIONADO: Eventos de TOUCH para mobile
            // Não há dragover/enter/leave para touch de slots, a lógica é diferente
            slot.addEventListener('drop', handleDrop); // Mantido para compatibilidade com mouse/desktop
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

    // 4. FUNÇÕES DE DRAG & DROP (MANTIDAS, MAS TOUCH TERÁ PRECEDÊNCIA)
    // Essas funções são para o mouse/desktop. Para mobile, as funções de touch abaixo assumem o controle.
    function handleDragStart(event) {
        currentDragPiece = event.target;
        event.dataTransfer.setData('text/plain', event.target.dataset.index);
        setTimeout(() => {
            event.target.classList.add('hide');
            currentDragPiece.classList.add('dragging');
            // NOVO: Adiciona um estilo temporário para a peça arrastada para não sumir visualmente
            event.target.style.opacity = '0.7'; 
        }, 0);
    }

    function handleDragEnd(event) {
        event.target.classList.remove('hide');
        currentDragPiece.classList.remove('dragging');
        // NOVO: Remove o estilo temporário
        event.target.style.opacity = ''; 
        document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
            slot.classList.remove('droptarget');
        });
    }

    // handleDragOver, handleDragEnter, handleDragLeave - A lógica de feedback para mouse
    // A lógica de drop será compartilhada entre mouse e touch.
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

    // FUNÇÃO DE DROP (Compartilhada entre mouse e touch)
    function handleDrop(event) {
        event.preventDefault(); // Necessário para drop do mouse
        let droppedPiece;
        let targetSlot;
        
        // Determina se o drop veio do mouse (event.dataTransfer) ou touch (currentTouchPiece)
        if (event.dataTransfer && event.dataTransfer.getData('text/plain')) {
            const droppedPieceIndex = event.dataTransfer.getData('text/plain');
            droppedPiece = document.querySelector(`.puzzle-piece[data-index="${droppedPieceIndex}"]`);
            targetSlot = event.target.closest('.puzzle-slot');
        } else if (currentTouchPiece) { // Se for touch event
            droppedPiece = currentTouchPiece;
            const touch = event.changedTouches[0]; // Pega a posição do toque final
            targetSlot = getDropTargetForTouch(touch.clientX, touch.clientY); // Função auxiliar para touch
            
            // Limpa estilos temporários da peça touch
            currentTouchPiece.style.position = '';
            currentTouchPiece.style.transform = '';
            currentTouchPiece.style.zIndex = '';
            currentTouchPiece.classList.remove('dragging'); // Remove dragging class
            currentTouchPiece = null; // Reseta a peça touch atual
        } else {
            return; // Nenhuma peça sendo arrastada/tocada
        }

        // Limpa o destaque do slot de destino, independentemente do sucesso
        if (targetSlot) {
            targetSlot.classList.remove('droptarget');
        }

        if (targetSlot && !targetSlot.children.length) { // Se o slot existe e está vazio
            if (parseInt(droppedPiece.dataset.index) === parseInt(targetSlot.dataset.index)) {
                targetSlot.appendChild(droppedPiece);
                droppedPiece.classList.add('placed');
                droppedPiece.style.cursor = 'default';
                moves++;
                movesDisplay.textContent = moves;
                correctPieceSound.play().catch(e => console.log("Erro ao tocar som de peça correta:", e));
                checkWin();
            } else {
                // Se o drop estiver incorreto, a peça pode voltar para sua posição original
                // ou apenas não se mover (como está agora).
                // Para simplificar, ela só se anexa se estiver no lugar certo e vazio.
            }
        } else if (droppedPiece && currentDragPiece === droppedPiece) { // Para o caso do mouse drag, se não encontrou slot válido
            // Isso é um tratamento básico para o caso de arrasto de mouse que não achou drop target válido.
            // Para touch, a peça já volta ao "normal" em handleTouchEnd
            // Considerar como a peça retorna à sua posição original se não houver um drop válido
        }
    }

    // NOVO: Função auxiliar para encontrar o slot de drop para eventos de toque
    function getDropTargetForTouch(x, y) {
        // Obter todos os slots e verificar qual deles está sob o toque
        const slots = document.querySelectorAll('.puzzle-slot');
        for (let i = 0; i < slots.length; i++) {
            const rect = slots[i].getBoundingClientRect(); // Pega a posição e tamanho do slot
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return slots[i]; // Retorna o slot se o toque estiver dentro dele
            }
        }
        return null; // Nenhum slot encontrado
    }


    // NOVO: FUNÇÕES PARA TOUCH DRAG & DROP
    function handleTouchStart(event) {
        // Apenas para um dedo (multi-touch não suportado neste drag-and-drop simples)
        if (event.touches.length === 1) {
            currentTouchPiece = event.target;
            // Garante que a peça pode ser movida livremente
            currentTouchPiece.style.position = 'absolute'; 
            currentTouchPiece.style.zIndex = '200'; // Acima de tudo

            // Calcula o offset inicial (onde o dedo tocou na peça)
            const rect = currentTouchPiece.getBoundingClientRect();
            initialX = event.touches[0].clientX;
            initialY = event.touches[0].clientY;
            offsetX = initialX - rect.left;
            offsetY = initialY - rect.top;

            // Adiciona classes para feedback visual
            currentTouchPiece.classList.add('dragging');
            
            // Opcional: Para evitar rolagem da página enquanto arrasta a peça
            event.preventDefault(); 
        }
    }

    function handleTouchMove(event) {
        if (currentTouchPiece) {
            event.preventDefault(); // Previne rolagem da página enquanto arrasta
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;

            // Move a peça para seguir o dedo, ajustando pelo offset inicial
            currentTouchPiece.style.left = `${touchX - offsetX}px`;
            currentTouchPiece.style.top = `${touchY - offsetY}px`;

            // NOVO: Feedback visual do slot alvo (simula dragenter/dragleave para touch)
            const targetSlot = getDropTargetForTouch(touchX, touchY);
            // Limpa o droptarget de todos os slots primeiro
            document.querySelectorAll('.puzzle-slot.droptarget').forEach(slot => {
                if (slot !== targetSlot) slot.classList.remove('droptarget');
            });

            if (targetSlot && !targetSlot.children.length) {
                // Se a peça atual é a correta para este slot, ou apenas para qualquer slot vazio
                if (parseInt(currentTouchPiece.dataset.index) === parseInt(targetSlot.dataset.index)) {
                     targetSlot.classList.add('droptarget');
                }
            }
        }
    }

    function handleTouchEnd(event) {
        if (currentTouchPiece) {
            // Dispara a lógica de drop, usando a peça touch como referência
            // A função handleDrop será adaptada para lidar com mouse ou touch
            handleDrop(event); // Reutiliza a função handleDrop

            // Limpa o estado após o drop
            // As propriedades de posição e classes são limpas dentro de handleDrop agora para touch
            currentTouchPiece = null;
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