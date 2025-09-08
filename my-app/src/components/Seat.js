import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChair } from '@fortawesome/free-solid-svg-icons';
import { SPACING } from '../config/dimensions';

const Seat = ({ id, isSelected, onClick, onMouseEnter, groupColor }) => {
  return (
    <div
      className={`seat ${isSelected ? 'selected' : ''}`}
      data-seatid={id}
      onClick={() => onClick(id)}
      onMouseDown={() => onClick(id, 'dragStart')}
      onMouseEnter={() => onMouseEnter && onMouseEnter(id)}
      style={{ 
        display: 'inline-block', 
        margin: `${SPACING.margin}px`, 
        cursor: 'pointer', 
        userSelect: 'none',
        position: 'relative'
      }}
    >
      <FontAwesomeIcon
        icon={faChair}
        size="2x"
        color={groupColor || (isSelected ? '#007bff' : '#6c757d')}
      />
    </div>
  );
};

export default Seat;
