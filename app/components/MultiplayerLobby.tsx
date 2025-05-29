import React, { useState, useEffect } from 'react';
import { useMultiplayerGameStore } from '../store/multiplayerGameStore';

export const MultiplayerLobby: React.FC = () => {  const {
    isConnected,
    isConnecting,
    connectionError,
    currentRoom,
    currentPlayerId,
    isHost,
    isGameStarted,
    showRoomCode,
    joinRoomInput,
    playerName,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    setJoinRoomInput,
    setPlayerName,
    setShowRoomCode,
    _initialize
  } = useMultiplayerGameStore();
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby'>('menu');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  
  // Initialize once on mount
  useEffect(() => {
    console.log('MultiplayerLobby: Component mounted');
    const cleanup = _initialize?.();
    
    return () => {
      console.log('MultiplayerLobby: Component unmounting');
      // Only run cleanup if we're really unmounting (not just re-rendering)
      if (cleanup) {
        // Add a small delay to prevent immediate disconnection in dev mode
        setTimeout(cleanup, 100);
      }
    };
  }, [_initialize]);

  // Handle connection separately
  useEffect(() => {
    console.log('MultiplayerLobby: Connection effect', {
      hasAttemptedConnection,
      isConnected,
      isConnecting
    });
    
    if (!hasAttemptedConnection && !isConnected && !isConnecting) {
      setHasAttemptedConnection(true);
      console.log('MultiplayerLobby: Attempting connection');
      connect();
    }
  }, [connect, isConnected, isConnecting, hasAttemptedConnection]);

  useEffect(() => {
    if (currentRoom) {
      setView('lobby');
    }
  }, [currentRoom]);

  useEffect(() => {
    if (isGameStarted) {
      // Game has started, this component should be hidden
      // and the main game component should be shown
    }
  }, [isGameStarted]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    const response = await createRoom(playerName.trim());
    
    if (!response.success) {
      setError(response.error || 'Failed to create room');
    }
    
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinRoomInput.trim()) {
      setError('Please enter room code');
      return;
    }

    setIsLoading(true);
    setError('');

    const response = await joinRoom(joinRoomInput.trim().toUpperCase(), playerName.trim());
    
    if (!response.success) {
      setError(response.error || 'Failed to join room');
    }
    
    setIsLoading(false);
  };

  const handleToggleReady = async () => {
    await toggleReady();
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    await startGame();
    setIsLoading(false);
  };
  const [copySuccess, setCopySuccess] = useState(false);

  const copyRoomCode = async () => {
    if (currentRoom) {
      try {
        await navigator.clipboard.writeText(currentRoom.id);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy room code:', err);
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = currentRoom.id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const getCurrentPlayer = () => {
    return currentRoom?.players.find(p => p.id === currentPlayerId);
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🌐</div>
          <h2 className="text-2xl font-bold mb-2">Connecting to Server...</h2>
          <div className="animate-pulse text-gray-300">Please wait</div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white bg-gray-800 p-8 rounded-lg border border-red-500">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">Connection Failed</h2>
          <p className="text-gray-300 mb-4">{connectionError}</p>
          <button
            onClick={connect}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (view === 'lobby' && currentRoom) {
    const currentPlayer = getCurrentPlayer();
    const allReady = currentRoom.players.every(p => p.isReady);
    const canStart = isHost && allReady && currentRoom.players.length >= 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700">
          {/* Room Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🏝️</div>
            <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>            <div className="flex items-center justify-center space-x-4">
              <div className="bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 flex items-center space-x-2">
                <span className="text-gray-300 text-sm">Room Code:</span>
                <span className="text-white font-mono text-lg font-bold">{currentRoom.id}</span>
                <button
                  onClick={copyRoomCode}
                  className={`px-2 py-1 rounded transition-all duration-200 ${
                    copySuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Copy room code to clipboard"
                >
                  {copySuccess ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
            </h3>
            <div className="space-y-3">
              {currentRoom.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    player.id === currentPlayerId
                      ? 'bg-blue-600 bg-opacity-20 border-blue-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-white font-semibold">{player.name}</span>
                    {player.id === currentPlayerId && (
                      <span className="text-xs bg-blue-500 px-2 py-1 rounded-full text-white">
                        You
                      </span>
                    )}
                    {!player.isConnected && (
                      <span className="text-xs bg-red-500 px-2 py-1 rounded-full text-white">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {player.isReady ? (
                      <span className="text-green-400 font-semibold">✓ Ready</span>
                    ) : (
                      <span className="text-gray-400">Waiting...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {currentPlayer && (
              <button
                onClick={handleToggleReady}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  currentPlayer.isReady
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {currentPlayer.isReady ? '❌ Not Ready' : '✅ Ready'}
              </button>
            )}

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  canStart
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Starting...' : '🚀 Start Game'}
              </button>
            )}

            <button
              onClick={() => {
                disconnect();
                setView('menu');
              }}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Leave Room
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 max-w-lg w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏝️</div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Settlers of Catan
          </h1>
          <p className="text-gray-300 text-lg">
            Online Multiplayer
          </p>
        </div>

        {view === 'menu' && (
          <div className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setView('create')}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
              >
                🏗️ Create Room
              </button>
              
              <button
                onClick={() => setView('join')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
              >
                🚪 Join Room
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="space-y-6">
            <button
              onClick={() => setView('menu')}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Create Room</h2>
              <p className="text-gray-300 mb-6">
                Create a new game room and invite friends to join
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isLoading || !playerName.trim()}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLoading || !playerName.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? 'Creating...' : '🏗️ Create Room'}
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className="space-y-6">
            <button
              onClick={() => setView('menu')}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Join Room</h2>
              <p className="text-gray-300 mb-6">
                Enter the room code to join an existing game
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
                placeholder="Enter 6-character code"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !playerName.trim() || !joinRoomInput.trim()}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLoading || !playerName.trim() || !joinRoomInput.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? 'Joining...' : '🚪 Join Room'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
