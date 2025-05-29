import React from 'react';
import { Hex as HexType } from '../types/game';

interface HexProps {
  hex: HexType;
  size?: number;
  onClick?: () => void;
}

const getTerrainColor = (terrain: string): string => {
  switch (terrain) {
    case 'wood': return '#2d7d32';
    case 'brick': return '#d84315';
    case 'sheep': return '#7cb342';
    case 'wheat': return '#fbc02d';
    case 'ore': return '#616161';
    case 'desert': return '#f57c00';
    default: return '#9e9e9e';
  }
};

const getTerrainIcon = (terrain: string): string => {
  switch (terrain) {
    case 'wood': return '🌲';
    case 'brick': return '🧱';
    case 'sheep': return '🐑';
    case 'wheat': return '🌾';
    case 'ore': return '⛰️';
    case 'desert': return '🏜️';
    default: return '';
  }
};

export const Hex: React.FC<HexProps> = ({ hex, size = 40, onClick }) => {
  const color = getTerrainColor(hex.terrain);
  const icon = getTerrainIcon(hex.terrain);
  
  // Use the coordinates directly from the hex object
  const centerX = hex.x;
  const centerY = hex.y;
    // Create hexagon points around the center (pointy-top orientation for Catan)
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top, flat top/bottom
    const x = centerX + size * Math.cos(angle);
    const y = centerY + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  const pointsString = points.join(' ');  return (
    <g 
      className={onClick ? "cursor-pointer" : ""}
    >
      {/* Hex shape - render first (bottom layer) */}
      <polygon
        points={pointsString}
        fill={color}
        stroke="#333"
        strokeWidth="2"
        opacity="0.8"
        className={onClick ? "hover:opacity-90 transition-opacity" : ""}
      />

      {/* Resource icon */}
      <text
        x={centerX}
        y={centerY - 8}
        textAnchor="middle"
        fontSize="20"
        className="select-none"
      >
        {icon}
      </text>
      
      {/* Number token */}
      {hex.number && (
        <>
          <circle
            cx={centerX}
            cy={centerY + 12}
            r="14"
            fill="#f5f5f5"
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x={centerX}
            y={centerY + 17}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            className="select-none"
            fill={hex.number === 6 || hex.number === 8 ? "#d32f2f" : "#333"}
          >
            {hex.number}
          </text>
        </>
      )}

      {/* Robber */}
      {hex.hasRobber && (
        <g>
          {/* Robber background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="16"
            fill="#000000"
            stroke="#333"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Robber icon */}
          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            fontSize="20"
            className="select-none"
          >
            🦹
          </text>
        </g>
      )}      {/* Clickable area for robber placement - render last (top layer) to capture clicks */}
      {onClick && (
        <polygon
          points={points.map(point => {
            const [x, y] = point.split(',').map(Number);
            const expandedX = centerX + (x - centerX) * 1.15;
            const expandedY = centerY + (y - centerY) * 1.15;
            return `${expandedX},${expandedY}`;
          }).join(' ')}
          fill="transparent"
          className="cursor-pointer hover:fill-blue-200 hover:fill-opacity-30 hover:stroke-blue-400 hover:stroke-2 transition-all duration-200"
          onClick={onClick}
        />
      )}
    </g>
  );
};
