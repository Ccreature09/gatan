import React from 'react';
import { Vertex as VertexType } from '../types/game';

interface VertexProps {
  vertex: VertexType;
  playerColor?: string;
  onClick?: () => void;
  canBuild?: boolean;
}

export const Vertex: React.FC<VertexProps> = ({ 
  vertex, 
  playerColor, 
  onClick, 
  canBuild 
}) => {
  const getBuildingIcon = () => {
    if (!vertex.building) return null;
    return vertex.building.type === 'city' ? '🏛️' : '🏠';
  };

  const buildingIcon = getBuildingIcon();
  const showBuildingSpot = canBuild && !vertex.building;
  const canUpgrade = vertex.building && vertex.building.type === 'settlement';  return (
    <g>
      {/* Building or building spot - render first (bottom layer) */}
      {buildingIcon ? (
        <>
          {/* Background circle for better visibility */}
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r="12"
            fill={playerColor}
            stroke="#fff"
            strokeWidth="2"
            opacity="0.9"
          />
          <text
            x={vertex.x}
            y={vertex.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            className="select-none"
            style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
          >
            {buildingIcon}
          </text>
        </>
      ) : showBuildingSpot ? (
        <>
          {/* Animated building spot - only when actually buildable */}
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r="8"
            fill="rgba(74, 222, 128, 0.7)"
            stroke="#16a34a"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r="4"
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#16a34a"
            strokeWidth="1"
          />
        </>
      ) : (
        <circle
          cx={vertex.x}
          cy={vertex.y}
          r="2"
          fill="#888"
          opacity="0.5"
          stroke="#fff"
          strokeWidth="1"
        />
      )}

      {/* Harbor indicator */}
      {vertex.harbor && (
        <text
          x={vertex.x + 18}
          y={vertex.y - 18}
          textAnchor="middle"
          fontSize="14"
          className="select-none"
          fill="#0066cc"
          fontWeight="bold"
          style={{ filter: 'drop-shadow(1px 1px 1px rgba(255,255,255,0.8))' }}
        >
          ⚓
        </text>
      )}      {/* Clickable area - render last (top layer) to capture clicks */}
      {onClick && (
        <circle
          cx={vertex.x}
          cy={vertex.y}
          r="16"
          fill="transparent"
          className="cursor-pointer hover:fill-blue-200 hover:fill-opacity-30 hover:stroke-blue-400 hover:stroke-2 transition-all duration-200"
          onClick={onClick}
        />
      )}
    </g>
  );
};
