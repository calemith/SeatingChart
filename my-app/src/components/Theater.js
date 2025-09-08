import React, { useState } from 'react';
import Seat from './Seat';
import GroupLabel from './GroupLabel';

// Generate distinct colors for different groups
const generateColor = (index) => {
  const colors = [
    '#FF6B6B', // red
    '#4ECDC4', // teal
    '#45B7D1', // blue
    '#96CEB4', // green
    '#FFEEAD', // yellow
    '#D4A5A5', // pink
    '#9B59B6', // purple
    '#3498DB', // bright blue
    '#F1C40F', // golden
    '#E67E22', // orange
  ];
  return colors[index % colors.length];
};

const Theater = () => {
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [seatLabels, setSeatLabels] = useState({});
  const [currentLabel, setCurrentLabel] = useState('');
  const [mode, setMode] = useState('none'); // 'none', 'labeling', 'clearing', 'seating'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSeat, setDragStartSeat] = useState(null);
  const [groupColors] = useState(new Map()); // Store group colors
  const [satSeats, setSatSeats] = useState(new Set()); // Track seats marked as sat
  
  // Add ref for the input field
  const labelInputRef = React.useRef(null);
  
  // Computed state for easier reading
  const isLabeling = mode === 'labeling';
  const isClearing = mode === 'clearing';

  // Configuration for different sections
  const frontSection = {
    rows: 4,
    seatsPerHalf: 7, // 7 seats on each side of the aisle
    aisleWidth: 2 // Width of aisle in seat-units
  };
  
  const backSection = {
    rows: 6,
    seatsPerHalf: 6, // 6 seats on each side of the aisle
    aisleWidth: 4 // Increased aisle width for back section
  };

  const handleSeatClick = (seatId, eventType = 'click') => {
    if (isLabeling) {
      if (eventType === 'dragStart') {
        setIsDragging(true);
        setDragStartSeat(seatId);
      }
      // In labeling mode, always add the seat to selection
      setSelectedSeats(prev => {
        const newSelection = new Set(prev);
        newSelection.add(seatId);
        return newSelection;
      });
    } else if (isClearing) {
      // If we're in clearing mode, remove the label from clicked seats
      if (eventType === 'dragStart') {
        setIsDragging(true);
        setDragStartSeat(seatId);
      }
      setSeatLabels(prev => {
        const newLabels = { ...prev };
        delete newLabels[seatId];
        return newLabels;
      });
    } else if (mode === 'seating') {
      // In seating mode, toggle sat status
      setSatSeats(prev => {
        const newSat = new Set(prev);
        if (newSat.has(seatId)) {
          newSat.delete(seatId);
        } else {
          newSat.add(seatId);
        }
        return newSat;
      });
    }
  };

  const handleSeatMouseEnter = (seatId) => {
    if (isDragging) {
      if (isLabeling) {
        setSelectedSeats(prev => {
          const newSelection = new Set(prev);
          newSelection.add(seatId);
          return newSelection;
        });
      } else if (isClearing) {
        setSeatLabels(prev => {
          const newLabels = { ...prev };
          delete newLabels[seatId];
          return newLabels;
        });
      }
    }
  };

  // Add mouse up handler to stop dragging
  React.useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStartSeat(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  // Removed autofocus effect to prevent mobile keyboard popup before seat selection

  const handleLabelSubmit = (e) => {
    e.preventDefault();
    if (currentLabel && selectedSeats.size > 0) {
      // Find the row(s) being labeled
      const selectedRows = Array.from(selectedSeats).map(seatId => {
        const [section, row] = seatId.split('-');
        return `${section}-${row}`;
      });
      // Check for color conflict in any row
      let colorToUse = groupColors.has(currentLabel)
        ? groupColors.get(currentLabel)
        : generateColor(groupColors.size);
      let colorConflict = false;
      selectedRows.forEach(rowKey => {
        // Find all labels in this row
        const rowLabels = Object.entries(seatLabels)
          .filter(([seatId]) => {
            const [section, row] = seatId.split('-');
            return `${section}-${row}` === rowKey;
          })
          .map(([, label]) => label);
        // Check if any label in this row uses the same color
        rowLabels.forEach(lbl => {
          if (groupColors.has(lbl) && groupColors.get(lbl) === colorToUse) {
            colorConflict = true;
          }
        });
      });
      // If conflict, pick a new color
      if (colorConflict) {
        // Find a color not used in any selected row
        const usedColors = new Set();
        selectedRows.forEach(rowKey => {
          Object.entries(seatLabels)
            .filter(([seatId]) => {
              const [section, row] = seatId.split('-');
              return `${section}-${row}` === rowKey;
            })
            .forEach(([, label]) => {
              if (groupColors.has(label)) {
                usedColors.add(groupColors.get(label));
              }
            });
        });
        // Find first available color
        let colorIdx = 0;
        let foundColor = null;
        while (foundColor === null && colorIdx < 100) {
          const candidate = generateColor(colorIdx);
          if (!usedColors.has(candidate)) {
            foundColor = candidate;
          }
          colorIdx++;
        }
        colorToUse = foundColor || generateColor(groupColors.size);
        // Update groupColors for this label
        groupColors.set(currentLabel, colorToUse);
      } else {
        // No conflict, set color as usual
        if (!groupColors.has(currentLabel)) {
          groupColors.set(currentLabel, colorToUse);
        }
      }
      // Apply the current label to all selected seats
      const newLabels = { ...seatLabels };
      selectedSeats.forEach(seatId => {
        newLabels[seatId] = currentLabel;
      });
      setSeatLabels(newLabels);
      setSelectedSeats(new Set()); // Clear selection but stay in selection mode
      setCurrentLabel(''); // Clear the input but stay in selection mode
    }
  };

  // Helper function to group seats by label
  const getSeatGroups = () => {
    const groups = new Map();
    Object.entries(seatLabels).forEach(([seatId, label]) => {
      if (!groups.has(label)) {
        groups.set(label, new Set());
      }
      groups.get(label).add(seatId);
    });
    return groups;
  };

  const renderRow = (rowIndex, seatsPerHalf, aisleWidth, sectionType) => {
    const seatGroups = getSeatGroups();

    // Helper to get left/right seats for a row and group
    const getSideSeats = (seats, side) =>
      seats.filter(seatId => seatId.split('-')[2][0] === side);

    // For preview label
    let previewLeftSeats = [];
    let previewRightSeats = [];
    if (isLabeling && selectedSeats.size > 0 && currentLabel) {
      const rowSeats = Array.from(selectedSeats).filter(seatId => {
        const [section, row] = seatId.split('-');
        return section === sectionType && parseInt(row) === rowIndex;
      });
      previewLeftSeats = getSideSeats(rowSeats, 'L');
      previewRightSeats = getSideSeats(rowSeats, 'R');
    }

    // For group labels
    const groupLabelsLeft = [];
    const groupLabelsRight = [];

    // For seat rendering, collect all left/right seats for this row
    const allRowSeatIds = Array(seatsPerHalf * 2).fill(0).map((_, i) => {
      // i: 0..seatsPerHalf*2-1
      // left: 0..seatsPerHalf-1, right: seatsPerHalf..seatsPerHalf*2-1
      if (i < seatsPerHalf) {
        return `${sectionType}-${rowIndex}-L${i}`;
      } else {
        return `${sectionType}-${rowIndex}-R${i - seatsPerHalf}`;
      }
    });
    const leftSeats = allRowSeatIds.filter(id => id.split('-')[2][0] === 'L');
    const rightSeats = allRowSeatIds.filter(id => id.split('-')[2][0] === 'R');

    // Helper to check if all seats in a group are sat
    const allSat = seatSet => Array.from(seatSet).every(seatId => satSeats.has(seatId));

    Array.from(seatGroups).forEach(([label, seats]) => {
      const rowSeats = Array.from(seats).filter(seatId => {
        const [section, row] = seatId.split('-');
        return section === sectionType && parseInt(row) === rowIndex;
      });
      const groupLeftSeats = getSideSeats(rowSeats, 'L');
      const groupRightSeats = getSideSeats(rowSeats, 'R');
      // Handler to clear all seats for a label
      const handleClearLabel = (lbl, seatSet) => {
        setSeatLabels(prev => {
          const newLabels = { ...prev };
          Array.from(seatSet).forEach(seatId => {
            delete newLabels[seatId];
          });
          return newLabels;
        });
      };
      // Handler to mark all seats in a group as sat
      const handleMarkSat = (lbl, seatSet) => {
        setSatSeats(prev => {
          const newSat = new Set(prev);
          Array.from(seatSet).forEach(seatId => {
            newSat.add(seatId);
          });
          return newSat;
        });
      };
      // Handler to unseat all seats in a group
      const handleUnseatGroup = (lbl, seatSet) => {
        setSatSeats(prev => {
          const newSat = new Set(prev);
          Array.from(seatSet).forEach(seatId => {
            newSat.delete(seatId);
          });
          return newSat;
        });
      };
      if (groupLeftSeats.length > 0) {
        groupLabelsLeft.push(
          <GroupLabel
            key={`${label}-${sectionType}-${rowIndex}-L`}
            seats={new Set(groupLeftSeats)}
            label={label}
            color={groupColors.get(label)}
            side="L"
            onClear={
              isClearing
                ? handleClearLabel
                : (mode === 'seating'
                  ? (allSat(groupLeftSeats)
                    ? handleUnseatGroup
                    : handleMarkSat)
                  : undefined)
            }
            isSat={allSat(groupLeftSeats)}
          />
        );
      }
      if (groupRightSeats.length > 0) {
        groupLabelsRight.push(
          <GroupLabel
            key={`${label}-${sectionType}-${rowIndex}-R`}
            seats={new Set(groupRightSeats)}
            label={label}
            color={groupColors.get(label)}
            side="R"
            onClear={
              isClearing
                ? handleClearLabel
                : (mode === 'seating'
                  ? (allSat(groupRightSeats)
                    ? handleUnseatGroup
                    : handleMarkSat)
                  : undefined)
            }
            isSat={allSat(groupRightSeats)}
          />
        );
      }
    });

    return (
      <div key={`${sectionType}-${rowIndex}`} style={{ position: 'relative', margin: '20px 0' }}>
        {/* Row of seats */}
        <div className="theater-row" style={{ textAlign: 'center', position: 'relative' }}>
          {/* Left side seats and label */}
          <div style={{ display: 'inline-block', position: 'relative' }}>
            {/* Group labels for left side */}
            {groupLabelsLeft}
            {/* Preview label for left side */}
            {previewLeftSeats.length > 0 && (
              <GroupLabel
                key={`preview-label-L-${sectionType}-${rowIndex}`}
                seats={new Set(previewLeftSeats)}
                label={currentLabel}
                color={groupColors.has(currentLabel) ? groupColors.get(currentLabel) : generateColor(groupColors.size)}
                isPreview={true}
                side="L"
              />
            )}
            {/* Render left seats */}
            {leftSeats.map((seatId, seat) => {
              const seatLabel = seatLabels[seatId];
              // Find the group for this seat
              let groupSat = false;
              Array.from(seatGroups).forEach(([label, seats]) => {
                if (seats.has(seatId)) {
                  const rowSeats = Array.from(seats).filter(sid => {
                    const [section, row] = sid.split('-');
                    return section === sectionType && parseInt(row) === rowIndex;
                  });
                  const groupLeftSeats = getSideSeats(rowSeats, 'L');
                  if (groupLeftSeats.includes(seatId) && allSat(groupLeftSeats)) {
                    groupSat = true;
                  }
                }
              });
              return (
                <div style={{ position: 'relative', display: 'inline-block' }} key={seatId}>
                  <Seat
                    id={seatId}
                    isSelected={selectedSeats.has(seatId)}
                    onClick={handleSeatClick}
                    onMouseEnter={handleSeatMouseEnter}
                    groupColor={seatLabel ? groupColors.get(seatLabel) : undefined}
                  />
                  {groupSat && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        color: 'black',
                        fontSize: '2em',
                        fontWeight: 'bold',
                        zIndex: 20,
                        opacity: 0.7,
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aisle space */}
          <div style={{ display: 'inline-block', width: `${aisleWidth * 40}px` }} />

          {/* Right side seats and label */}
          <div style={{ display: 'inline-block', position: 'relative' }}>
            {/* Group labels for right side */}
            {groupLabelsRight}
            {/* Preview label for right side */}
            {previewRightSeats.length > 0 && (
              <GroupLabel
                key={`preview-label-R-${sectionType}-${rowIndex}`}
                seats={new Set(previewRightSeats)}
                label={currentLabel}
                color={groupColors.has(currentLabel) ? groupColors.get(currentLabel) : generateColor(groupColors.size)}
                isPreview={true}
                side="R"
              />
            )}
            {/* Render right seats */}
            {rightSeats.map((seatId, seat) => {
              const seatLabel = seatLabels[seatId];
              // Find the group for this seat
              let groupSat = false;
              Array.from(seatGroups).forEach(([label, seats]) => {
                if (seats.has(seatId)) {
                  const rowSeats = Array.from(seats).filter(sid => {
                    const [section, row] = sid.split('-');
                    return section === sectionType && parseInt(row) === rowIndex;
                  });
                  const groupRightSeats = getSideSeats(rowSeats, 'R');
                  if (groupRightSeats.includes(seatId) && allSat(groupRightSeats)) {
                    groupSat = true;
                  }
                }
              });
              return (
                <div style={{ position: 'relative', display: 'inline-block' }} key={seatId}>
                  <Seat
                    id={seatId}
                    isSelected={selectedSeats.has(seatId)}
                    onClick={handleSeatClick}
                    onMouseEnter={handleSeatMouseEnter}
                    groupColor={seatLabel ? groupColors.get(seatLabel) : undefined}
                  />
                  {groupSat && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        color: 'black',
                        fontSize: '2em',
                        fontWeight: 'bold',
                        zIndex: 20,
                        opacity: 0.7,
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSeats = () => {
    const seatArray = [];

    // Render front section (4 rows of 14 seats with aisle)
    for (let row = 0; row < frontSection.rows; row++) {
      seatArray.push(renderRow(row, frontSection.seatsPerHalf, frontSection.aisleWidth, 'front'));
    }

    // Add space between sections
    seatArray.push(
      <div key="section-divider" style={{ height: '40px' }} />
    );

    // Render back section (6 rows of 12 seats with aisle)
    for (let row = 0; row < backSection.rows; row++) {
      seatArray.push(renderRow(row, backSection.seatsPerHalf, backSection.aisleWidth, 'back'));
    }

    return seatArray;
  };

  // Calculate remaining unseated labeled chairs
  const remainingUnseated = Object.keys(seatLabels).filter(seatId => !satSeats.has(seatId)).length;

  // Helper to get seatId from a touch event
  const getSeatIdFromTouch = (touch, container) => {
    const x = touch.clientX;
    const y = touch.clientY;
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    // Traverse up to find .seat
    let seatDiv = el;
    while (seatDiv && !seatDiv.classList.contains('seat')) {
      seatDiv = seatDiv.parentElement;
    }
    if (seatDiv && seatDiv.getAttribute('data-seatid')) {
      return seatDiv.getAttribute('data-seatid');
    }
    return null;
  };

  // Touch event handlers for drag-select
  const handleTouchStart = (e) => {
    if (!(isLabeling || isClearing)) return;
    const container = e.currentTarget;
    const touch = e.touches[0];
    const seatId = getSeatIdFromTouch(touch, container);
    if (seatId) {
      handleSeatClick(seatId, 'dragStart');
    }
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !(isLabeling || isClearing)) return;
    const container = e.currentTarget;
    const touch = e.touches[0];
    const seatId = getSeatIdFromTouch(touch, container);
    if (seatId) {
      handleSeatMouseEnter(seatId);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStartSeat(null);
  };

  return (
    <div className="theater">
      <div className="controls" style={{ marginBottom: '20px', textAlign: 'center' }}>
        {/* ...existing code... */}
        <button
          onClick={() => {
            setMode(mode === 'labeling' ? 'none' : 'labeling');
            setSelectedSeats(new Set());
          }}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: isLabeling ? '#007bff' : '#90EE90',
            color: isLabeling ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isLabeling ? 'Cancel Selection' : 'Make Seating Chart'}
        </button>
        <button
          onClick={() => {
            setMode(mode === 'clearing' ? 'none' : 'clearing');
            setSelectedSeats(new Set());
          }}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: isClearing ? '#ffc107' : '#6c757d',
            color: isClearing ? 'black' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isClearing ? 'Exit Clear Mode' : 'Remove seating'}
        </button>
        <button
          onClick={() => {
            setMode(mode === 'seating' ? 'none' : 'seating');
          }}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: mode === 'seating' ? '#6c63ff' : '#e0e0e0',
            color: mode === 'seating' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {mode === 'seating' ? 'Exit Seating Patrons' : 'Seating Patrons Mode'}
        </button>
        <button
          onClick={() => {
            setSeatLabels({});
            setSelectedSeats(new Set());
            setSatSeats(new Set());
            setMode('none');
          }}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All Labels
        </button>
        {isLabeling && (
          <form onSubmit={handleLabelSubmit} style={{ display: 'inline-block' }}>
            <input
              ref={labelInputRef}
              type="text"
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              placeholder="Enter group label"
              style={{
                padding: '8px',
                marginRight: '10px',
                borderRadius: '4px',
                border: '1px solid #ced4da'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Apply Label
            </button>
          </form>
        )}
      </div>
      {mode === 'seating' && (
        <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>
          Remaining unseated labeled chairs: {remainingUnseated}
        </div>
      )}
      <div
        className="seating-area"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          overflowX: 'auto',
          padding: '0 2vw',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderSeats()}
      </div>
    </div>
  );
};

export default Theater;
