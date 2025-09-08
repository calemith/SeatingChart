import React, { useRef, useState, useEffect } from 'react';
import { getDimensions } from '../config/dimensions';
import { SPACING } from '../config/spacing';

function GroupLabel({ seats, label, color, isPreview = false, onClear, isSat = false, side }) {
  const labelRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [dimensions, setDimensions] = useState(getDimensions());
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(window.innerWidth <= 1024);

  // Update dimensions and screen size on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getDimensions());
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (labelRef.current) {
      setIsTruncated(labelRef.current.scrollWidth > labelRef.current.clientWidth);
    }
  }, [label, seats]);

  if (seats.size === 0) return null;

  // Parse all seat IDs to get section and row info
  const seatInfo = Array.from(seats).map(seatId => {
    const [section, row, pos] = seatId.split('-');
    return {
      section,
      row: parseInt(row),
      side: pos[0],
      index: parseInt(pos.slice(1)),
      id: seatId
    };
  });

  if (seatInfo.length === 0) return null;

  // Group seats by row
  const rowGroups = seatInfo.reduce((acc, seat) => {
    const rowKey = `${seat.section}-${seat.row}`;
    if (!acc[rowKey]) {
      acc[rowKey] = [];
    }
    acc[rowKey].push(seat);
    return acc;
  }, {});

  // Get dimensions of a single seat
  const seatUnit = dimensions.seatWidth * (isMobileOrTablet ? 1.1 : 2); // Use smaller multiplier for mobile/tablet
  const seatMargin = dimensions.seatMargin;

  // Use the first row's seats for this label
  const currentRow = Object.values(rowGroups)[0];
  
  // Sort seats by index within their side (L/R)
  const leftSeats = currentRow.filter(seat => seat.side === 'L').sort((a, b) => a.index - b.index);
  const rightSeats = currentRow.filter(seat => seat.side === 'R').sort((a, b) => a.index - b.index);

  let startIndex, endIndex, labelWidth;
  
  if (leftSeats.length > 0) {
    startIndex = leftSeats[0].index;
    endIndex = leftSeats[leftSeats.length - 1].index;
    labelWidth = ((endIndex - startIndex + 1) * seatUnit) + (endIndex - startIndex) * seatMargin;
  } else if (rightSeats.length > 0) {
    startIndex = rightSeats[0].index;
    endIndex = rightSeats[rightSeats.length - 1].index;
    labelWidth = ((endIndex - startIndex + 1) * seatUnit) + (endIndex - startIndex) * seatMargin;
  } else {
    return null;
  }
  
  // Handler for showing full text if truncated
  const handleLabelClick = () => {
    if (onClear) {
      onClear(label, seats);
    } else if (isTruncated) {
      window.alert(label);
    }
  };

  // Calculate position based on the selected seats
  let startPos;
  if (leftSeats.length > 0) {
    // For left seats, start from their index position
    startPos = leftSeats[0].index * (seatUnit + seatMargin);
  } else {
    startPos = rightSeats[0].index * (seatUnit + seatMargin);
  }

  const style = {
    position: 'absolute',
    left: `${startPos}px`,
    top: '5px', // Position directly on top of the seats
    width: `${labelWidth}px`,
    padding: '2px 4px',
    backgroundColor: color,
    color: '#000',
    fontSize: `${Math.max(8, Math.min(11, dimensions.seatWidth * 0.45))}px`,
    fontWeight: '500',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: isPreview ? 21 : (isSat ? 20 : 25), // Increased z-index to ensure label is above seats
    boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
    border: isPreview ? '1px dashed #000' : '1px solid rgba(0,0,0,0.1)',
    opacity: isPreview ? 0.4 : 0.6, // 50% opacity for regular labels, slightly more transparent for previews
    cursor: (onClear || isTruncated) ? 'pointer' : 'default',
    textDecoration: isSat ? 'line-through' : 'none',
    borderRadius: '2px',
    lineHeight: '1',
    height: `${Math.max(12, dimensions.seatWidth * 0.6)}px`,
    margin: 0,
    minWidth: `${dimensions.seatWidth}px` // Ensure label is at least as wide as one seat
  };

  return (
    <div
      ref={labelRef}
      style={style}
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
