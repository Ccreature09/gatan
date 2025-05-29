'use client';

interface VictoryScreenProps {
  winnerId: string;
  winnerName: string;
  winnerColor: string;
  onNewGame: () => void;
}

export const VictoryScreen = ({ winnerId, winnerName, winnerColor, onNewGame }: VictoryScreenProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Victory!</h1>
          <div 
            className="text-2xl font-semibold mb-4 p-4 rounded-lg"
            style={{ backgroundColor: winnerColor, color: 'white' }}
          >
            {winnerName} Wins!
          </div>
          <p className="text-gray-600">
            Congratulations! You have reached 10 victory points and won the game!
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Final Score</h3>
            <div className="text-3xl font-bold" style={{ color: winnerColor }}>
              10+ Victory Points
            </div>
          </div>
          
          <button
            onClick={onNewGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};
