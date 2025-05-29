import React from 'react';
import { Edge as EdgeType, Vertex } from '../types/game';

interface EdgeProps {
  edge: EdgeType;
  vertices: Vertex[];
  playerColor?: string;
  onClick?: () => void;
  canBuild?: boolean;
}

export const Edge: React.FC<EdgeProps> = ({ 
  edge, 
  vertices, 
  playerColor, 
  onClick, 
  canBuild 
}) => {
  const vertex1 = vertices.find(v => v.id === edge.vertexIds[0]);
  const vertex2 = vertices.find(v => v.id === edge.vertexIds[1]);

  if (!vertex1 || !vertex2) return null;

  const showRoadSpot = canBuild && !edge.road;
  const hasRoad = !!edge.road;  return (
    <g>
      {/* Road line - render first (bottom layer) */}
      <line
        x1={vertex1.x}
        y1={vertex1.y}
        x2={vertex2.x}
        y2={vertex2.y}
        stroke={hasRoad ? playerColor : showRoadSpot ? "#4ade80" : "#ddd"}
        strokeWidth={hasRoad ? "6" : showRoadSpot ? "4" : "2"}
        strokeOpacity={hasRoad ? 1 : showRoadSpot ? 0.8 : 0.4}
        strokeLinecap="round"
        className={showRoadSpot ? "animate-pulse" : ""}
        style={hasRoad ? { filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' } : {}}
      />      {/* Clickable area - render last (top layer) to capture clicks */}
      {onClick && (
        <line
          x1={vertex1.x}
          y1={vertex1.y}
          x2={vertex2.x}
          y2={vertex2.y}
          stroke="transparent"
          strokeWidth="16"
          className="cursor-pointer hover:stroke-blue-400 hover:stroke-opacity-50 transition-all duration-200"
          onClick={onClick}
        />
      )}
    </g>
  );
};
