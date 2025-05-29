import React, { useState, useEffect } from 'react';

interface ActiveGameSession {
  roomId: string;
  playerName: string;
  playerId: string;
  timestamp: number;
}

interface MainMenuProps {
  onSelectMode: (mode: 'local' | 'online') => void;
  onRejoinGame?: (sessionData: ActiveGameSession) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode, onRejoinGame }) => {
  const [activeSession, setActiveSession] = useState<ActiveGameSession | null>(null);
  useEffect(() => {
    // Check for active game session in localStorage
    const savedSession = localStorage.getItem('activeGameSession');
    console.log('MainMenu: Checking for saved session:', savedSession);
    
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession) as ActiveGameSession;
        console.log('MainMenu: Parsed session data:', sessionData);
        
        // Only consider sessions from the last 2 hours as potentially active
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        if (sessionData.timestamp > twoHoursAgo) {
          console.log('MainMenu: Session is recent, showing rejoin button');
          setActiveSession(sessionData);
        } else {
          console.log('MainMenu: Session is too old, removing');
          // Clean up old session
          localStorage.removeItem('activeGameSession');
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('activeGameSession');
      }
    } else {
      console.log('MainMenu: No saved session found');
    }
  }, []);

  const handleRejoinGame = () => {
    if (activeSession && onRejoinGame) {
      onRejoinGame(activeSession);
    }
  };

  const handleDismissSession = () => {
    localStorage.removeItem('activeGameSession');
    setActiveSession(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 max-w-lg w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏝️</div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Settlers of Catan
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your game mode to start playing
          </p>
        </div>        <div className="space-y-6">
          {/* Rejoin Game Button - Show if there's an active session */}
          {activeSession && (
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 border border-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🔄</div>
                  <div>
                    <h3 className="text-white font-bold">Active Game Found</h3>
                    <p className="text-orange-200 text-sm">
                      Room: {activeSession.roomId} • Player: {activeSession.playerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissSession}
                  className="text-orange-300 hover:text-white text-xl"
                  title="Dismiss this session"
                >
                  ×
                </button>
              </div>
              <button
                onClick={handleRejoinGame}
                className="w-full mt-3 p-3 bg-orange-800 hover:bg-orange-900 text-white rounded-lg transition-all duration-200 font-semibold"
              >
                Rejoin Game
              </button>
            </div>
          )}

          {/* Online Multiplayer */}
          <button
            onClick={() => onSelectMode('online')}
            className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="text-3xl">🌐</div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Online Multiplayer</h3>
                <p className="text-blue-200 text-sm">
                  Play with friends across the internet
                </p>
              </div>
            </div>
          </button>

          {/* Local Multiplayer */}
          <button
            onClick={() => onSelectMode('local')}
            className="w-full p-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="text-3xl">🏠</div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Local Multiplayer</h3>
                <p className="text-green-200 text-sm">
                  Play on the same device with friends
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
          <h4 className="text-white font-semibold mb-2">Game Features:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 2-4 player support</li>
            <li>• Automatic dice rolling</li>
            <li>• Interactive board with zoom & pan</li>
            <li>• Resource trading system</li>
            <li>• Development cards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
