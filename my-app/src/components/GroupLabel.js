
import React, { useRef, useState, useEffect } from 'react';

const SEAT_WIDTH = 40;
const SEAT_MARGIN = 5; // Match Seat.js margin
const AISLE_WIDTH = 80;

// Helper: get left offset for a seat
// If seat numbers start at 1, subtract 1 for index-based positioning
function getSeatLeftOffset(side, number) {
  const seatIndex = number - 1;
  if (side === 'L') {
    return seatIndex * (SEAT_WIDTH + SEAT_MARGIN);
  } else if (side === 'R') {
    const rightSideStart = (7 * (SEAT_WIDTH + SEAT_MARGIN)) + AISLE_WIDTH;
    return rightSideStart + seatIndex * (SEAT_WIDTH + SEAT_MARGIN);
  }
  return 0;
}


function GroupLabel({ seats, label, color, isPreview = false, side, onClear, isSat = false }) {
  const labelRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (labelRef.current) {
      setIsTruncated(labelRef.current.scrollWidth > labelRef.current.clientWidth);
    }
  }, [label, seats]);
  // Parse seat coordinates
  const seatIndices = Array.from(seats).map(seatId => {
    const position = seatId.split('-')[2];
    return parseInt(position.slice(1));
  });
  if (seatIndices.length === 0) return null;
  const minIndex = Math.min(...seatIndices);
  const maxIndex = Math.max(...seatIndices);
  const seatCount = maxIndex - minIndex + 1;
  // For a single seat, label width should be SEAT_WIDTH
  const labelWidth = seatCount === 1
    ? SEAT_WIDTH
    : (seatCount * SEAT_WIDTH) + ((seatCount - 1) * SEAT_MARGIN);
  // For a single seat, align label exactly with seat
  const labelLeft = minIndex * (SEAT_WIDTH + SEAT_MARGIN);
  // Handler for showing full text if truncated
  const handleLabelClick = () => {
    if (onClear) {
      onClear(label, seats);
    } else if (isTruncated) {
      window.alert(label); // Replace with a tooltip/modal for production
    }
  };

  return (
    <div
      ref={labelRef}
      style={{
        position: 'absolute',
        top: 0,
        left: `${labelLeft}px`,
        width: `${labelWidth}px`,
        backgroundColor: color,
        color: '#000000',
        padding: '4px 0',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '700',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
        zIndex: isPreview ? 11 : 10,
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        border: isPreview ? '2px dashed #000' : 'none',
        opacity: isPreview ? 0.8 : 0.5,
        cursor: (onClear || isTruncated) ? 'pointer' : 'default',
  textDecoration: isSat ? 'line-through' : 'none',
      }}
      onClick={handleLabelClick}
      title={onClear ? 'Click to clear all seats for this label' : (isTruncated ? 'Click to show full label' : undefined)}
    >
      {label}
      {isSat && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc3545',
            fontSize: '2em',
            fontWeight: 'bold',
            opacity: 0.3,
            zIndex: 12,
          }}
        >
          ×
        </span>
      )}
    </div>
  );
}

export default GroupLabel;
