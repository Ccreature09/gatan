import React from 'react';
import { useMultiplayerGameActions } from '../store/multiplayerGameActions';
import { useMultiplayerGameInterface } from '../store/multiplayerGameInterface';

interface DiceProps {
  value: number;
  isRolling?: boolean;
}

const DiceDisplay: React.FC<DiceProps> = ({ value, isRolling }) => {
  const getDots = (value: number) => {
    const dotPositions = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };

    return dotPositions[value as keyof typeof dotPositions] || [];
  };

  const dots = getDots(value);

  return (
    <div className={`w-16 h-16 bg-white border-2 border-gray-800 rounded-lg flex items-center justify-center relative ${
      isRolling ? 'animate-spin' : ''
    }`}>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12">
        {Array.from({ length: 9 }).map((_, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          
          return (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                hasDot ? 'bg-gray-800' : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const DiceRoller: React.FC = () => {
  const { diceRoll, rollDice, phase, currentPlayerId } = useMultiplayerGameActions();
  const { isMultiplayer, localPlayerId } = useMultiplayerGameInterface();
  const [isRolling, setIsRolling] = React.useState(false);
  // Check if it's the local player's turn in multiplayer
  const isMyTurn = !isMultiplayer || (localPlayerId === currentPlayerId);

  const handleRollDice = async () => {
    if (!isMyTurn) return; // Don't allow rolling if it's not your turn
    
    setIsRolling(true);
    
    // Add some delay for animation
    setTimeout(() => {
      rollDice();
      setIsRolling(false);
    }, 1000);
  };

  if (phase !== 'roll-dice' && !diceRoll) {
    return null;
  }

  return (
    <div className="text-center space-y-4">      {diceRoll && (
        <div className="flex items-center justify-center space-x-4">
          <DiceDisplay value={diceRoll[0]} isRolling={isRolling} />
          <span className="text-2xl font-bold text-white">+</span>
          <DiceDisplay value={diceRoll[1]} isRolling={isRolling} />
          <span className="text-2xl font-bold text-white">=</span>
          <div className="w-16 h-16 bg-yellow-400 border-2 border-yellow-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800">{diceRoll[0] + diceRoll[1]}</span>
          </div>
        </div>      )}
      
      {phase === 'roll-dice' && !diceRoll && (
        <div className="space-y-2">
          <button
            onClick={handleRollDice}
            disabled={!isMyTurn || isRolling}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 ${
              !isMyTurn 
                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                : isRolling
                ? 'bg-yellow-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transform hover:scale-105'
            }`}
          >
            {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
          </button>
          {!isMyTurn && isMultiplayer && (
            <p className="text-xs text-gray-400">Wait for your turn to roll</p>
          )}
        </div>
      )}
      
      {phase === 'roll-dice' && diceRoll && (
        <p className="text-sm text-gray-300">Dice rolled! Continue your turn.</p>
      )}
    </div>
  );
};
