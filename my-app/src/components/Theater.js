import React, { useState } from 'react';
import Seat from './Seat';
import GroupLabel from './GroupLabel';
import './Theater.css';

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

  const fileInputRef = React.useRef(null);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [seatLabels, setSeatLabels] = useState(() => {
    const saved = localStorage.getItem('seatLabels');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Create theater seating representation

  // Create theater seating representation
  const theaterMap = {
    frontSeats: Array(frontSection.rows).fill().map(() => 
      Array(frontSection.seatsPerHalf * 2).fill(true)  // true means available
    ),
    backSeats: Array(backSection.rows).fill().map(() => 
      Array(backSection.seatsPerHalf * 2).fill(true)
    )
  };

  // Function to convert array position to seat ID
  const arrayPosToSeatId = (section, row, col) => {
    const seatsPerHalf = section === 'front' ? frontSection.seatsPerHalf : backSection.seatsPerHalf;
    const side = col < seatsPerHalf ? 'L' : 'R';
    const seatNum = col < seatsPerHalf ? col : col - seatsPerHalf;
    return `${section}-${row}-${side}${seatNum}`;
  };

  // Function to update theater map
  const updateTheaterMap = () => {
    // Reset all seats to available
    theaterMap.frontSeats = Array(frontSection.rows).fill().map(() => 
      Array(frontSection.seatsPerHalf * 2).fill(true)
    );
    theaterMap.backSeats = Array(backSection.rows).fill().map(() => 
      Array(backSection.seatsPerHalf * 2).fill(true)
    );
    
    // Mark seats as unavailable based on current labels
    Object.keys(seatLabels).forEach(seatId => {
      const [section, row, position] = seatId.split('-');
      const seatArray = section === 'front' ? theaterMap.frontSeats : theaterMap.backSeats;
      const seatsPerHalf = section === 'front' ? frontSection.seatsPerHalf : backSection.seatsPerHalf;
      const rowIndex = parseInt(row);
      const side = position[0];
      const seatNum = parseInt(position.slice(1));
      
      // Calculate column index
      const colIndex = side === 'L' ? seatNum : seatsPerHalf + seatNum;
      seatArray[rowIndex][colIndex] = false;  // false means taken
    });
  };

  // Function to check if a seat is available
  const isSeatAvailable = (seatId) => {
    const [section, row, position] = seatId.split('-');
    const seatArray = section === 'front' ? theaterMap.frontSeats : theaterMap.backSeats;
    const seatsPerHalf = section === 'front' ? frontSection.seatsPerHalf : backSection.seatsPerHalf;
    const rowIndex = parseInt(row);
    const side = position[0];
    const seatNum = parseInt(position.slice(1));
    const colIndex = side === 'L' ? seatNum : seatsPerHalf + seatNum;
    
    return seatArray[rowIndex][colIndex];
  };

  // Function to get next available seat using theater map
  const getNextAvailableSeat = (startSection, startRow, preferredCol = 0, isLeftToRight = true) => {
    let currentSection = startSection;
    let currentRow = startRow;
    
    // Try finding seat in current section
    while (true) {
      const seatArray = currentSection === 'front' ? theaterMap.frontSeats : theaterMap.backSeats;
      const seatsPerRow = currentSection === 'front' ? frontSection.seatsPerHalf * 2 : backSection.seatsPerHalf * 2;
      const maxRows = currentSection === 'front' ? frontSection.rows : backSection.rows;
      
      // Validate row index
      if (currentRow >= maxRows) {
        if (currentSection === 'front') {
          currentSection = 'back';
          currentRow = 0;
        } else {
          break;  // No more seats available
        }
        continue;
      }
      
      // Get seats in current row
      const rowSeats = seatArray[currentRow];
      if (!rowSeats) break; // Invalid row
      
      if (isLeftToRight) {
        // Search left to right starting from preferred column
        for (let col = preferredCol; col < seatsPerRow; col++) {
          if (rowSeats[col]) {
            return { 
              seatId: arrayPosToSeatId(currentSection, currentRow, col),
              nextCol: col + 1,
              nextRow: col + 1 >= seatsPerRow ? currentRow + 1 : currentRow,
              nextSection: col + 1 >= seatsPerRow && currentRow + 1 >= maxRows ? 
                (currentSection === 'front' ? 'back' : null) : currentSection
            };
          }
        }
        // If we get here and preferred column wasn't 0, try from the beginning of the row
        if (preferredCol > 0) {
          for (let col = 0; col < preferredCol; col++) {
            if (rowSeats[col]) {
              return { 
                seatId: arrayPosToSeatId(currentSection, currentRow, col),
                nextCol: col + 1,
                nextRow: col + 1 >= seatsPerRow ? currentRow + 1 : currentRow,
                nextSection: col + 1 >= seatsPerRow && currentRow + 1 >= maxRows ? 
                  (currentSection === 'front' ? 'back' : null) : currentSection
              };
            }
          }
        }
      } else {
        // Search right to left starting from preferred column
        const startCol = preferredCol >= 0 ? preferredCol : seatsPerRow - 1;
        for (let col = startCol; col >= 0; col--) {
          if (rowSeats[col]) {
            return {
              seatId: arrayPosToSeatId(currentSection, currentRow, col),
              nextCol: col - 1,
              nextRow: col - 1 < 0 ? currentRow + 1 : currentRow,
              nextSection: col - 1 < 0 && currentRow + 1 >= maxRows ?
                (currentSection === 'front' ? 'back' : null) : currentSection
            };
          }
        }
      }
      
      // Move to next row
      currentRow++;
    }
    
    return null;  // No seats available
  };

  // Find consecutive seats starting from a specific position
  const findConsecutiveSeatsFromPosition = (numSeats, startSection, startRow) => {
    const seats = [];
    let currentSection = startSection;
    let currentRow = startRow;
    let remainingSeats = numSeats;
    
    while (remainingSeats > 0) {
      // Count available seats in current row
      const seatArray = currentSection === 'front' ? theaterMap.frontSeats : theaterMap.backSeats;
      const seatsPerRow = currentSection === 'front' ? frontSection.seatsPerHalf * 2 : backSection.seatsPerHalf * 2;
      const rowSeats = seatArray[currentRow];
      const isLeftToRight = currentRow % 2 === 0;
      
      // Get consecutive available seats in current row
      let availableInRow = [];
      if (isLeftToRight) {
        for (let col = 0; col < seatsPerRow; col++) {
          if (rowSeats[col]) {
            availableInRow.push({
              seatId: arrayPosToSeatId(currentSection, currentRow, col),
              col: col
            });
          } else if (availableInRow.length < remainingSeats) {
            // Reset if we don't have enough consecutive seats
            availableInRow = [];
          }
        }
      } else {
        for (let col = seatsPerRow - 1; col >= 0; col--) {
          if (rowSeats[col]) {
            availableInRow.push({
              seatId: arrayPosToSeatId(currentSection, currentRow, col),
              col: col
            });
          } else if (availableInRow.length < remainingSeats) {
            // Reset if we don't have enough consecutive seats
            availableInRow = [];
          }
        }
      }
      
      // Use as many seats as we can from this row
      const seatsToUse = Math.min(availableInRow.length, remainingSeats);
      if (seatsToUse > 0) {
        // Take the seats from this row
        const selectedSeats = availableInRow.slice(0, seatsToUse);
        selectedSeats.forEach(seat => {
          seats.push(seat.seatId);
          // Mark seat as taken
          rowSeats[seat.col] = false;
        });
        remainingSeats -= seatsToUse;
      }
      
      // If we still need more seats, move to next row
      if (remainingSeats > 0) {
        currentRow++;
        const maxRows = currentSection === 'front' ? frontSection.rows : backSection.rows;
        
        if (currentRow >= maxRows) {
          if (currentSection === 'front') {
            currentSection = 'back';
            currentRow = 0;
          } else {
            // No more rows available
            // Undo any assignments we made if we couldn't fit the whole group
            seats.forEach(seatId => {
              const [section, row, position] = seatId.split('-');
              const array = section === 'front' ? theaterMap.frontSeats : theaterMap.backSeats;
              const seatsPerHalf = section === 'front' ? frontSection.seatsPerHalf : backSection.seatsPerHalf;
              const rowIndex = parseInt(row);
              const side = position[0];
              const seatNum = parseInt(position.slice(1));
              const colIndex = side === 'L' ? seatNum : seatsPerHalf + seatNum;
              array[rowIndex][colIndex] = true;  // Mark as available again
            });
            return [];
          }
        }
      }
    }
    
    return seats;
  };

  // Find the best available seats for a group
  const findConsecutiveSeats = (numSeats) => {
    return findConsecutiveSeatsFromPosition(numSeats, 'front', 0);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length < 2) throw new Error('CSV file is empty or invalid');

    // Get headers from first line and clean them
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'tickets', 'purchasedate'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    const data = lines.slice(1)
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          if (header === 'purchasedate') {
            // Ensure date is properly parsed
            const date = new Date(values[index]);
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date format in row: ${line}. Date should be in YYYY-MM-DD format.`);
            }
            row[header] = date;
          } else if (header === 'tickets') {
            const tickets = parseInt(values[index]);
            if (isNaN(tickets) || tickets <= 0) {
              throw new Error(`Invalid ticket number in row: ${line}. Must be a positive number.`);
            }
            row[header] = tickets;
          } else {
            row[header] = values[index];
          }
        });
        return row;
      })
      .sort((a, b) => a.purchasedate - b.purchasedate); // Sort by purchase date

    return data;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Parse CSV and sort by purchase date
          const ticketData = parseCSV(e.target.result);
          
          // Clear all existing assignments
          const newSeatLabels = {};
          const newGroupColors = new Map();
          
          // Check total capacity
          const totalSeats = (frontSection.rows * frontSection.seatsPerHalf * 2) + 
                           (backSection.rows * backSection.seatsPerHalf * 2);
          const totalRequested = ticketData.reduce((sum, ticket) => sum + ticket.tickets, 0);
          
          if (totalRequested > totalSeats) {
            throw new Error(`Total tickets requested (${totalRequested}) exceeds available seats (${totalSeats})`);
          }

          // Process each group in purchase date order, starting from front
          let currentSection = 'front';
          let currentRow = 0;
          
          // Initialize theater map once at the start
          updateTheaterMap();

          // Process each group in purchase date order
          for (let i = 0; i < ticketData.length; i++) {
            const ticket = ticketData[i];
            if (ticket.tickets > 0) {
              // Try to find seats for this group
              const selectedSeats = findConsecutiveSeatsFromPosition(ticket.tickets, currentSection, currentRow);
              
              if (selectedSeats.length === ticket.tickets) {
                // Assign color and label seats
                const groupColor = generateColor(i);
                newGroupColors.set(ticket.name, groupColor);
                
                selectedSeats.forEach(seatId => {
                  newSeatLabels[seatId] = ticket.name;
                });
                
                // Update position to continue in the same row
                const lastSeat = selectedSeats[selectedSeats.length - 1];
                const [section, row, position] = lastSeat.split('-');
                currentSection = section;
                currentRow = parseInt(row); // Stay in the same row
                
                // Check if we filled the row
                const rowSeats = currentSection === 'front' ? 
                  theaterMap.frontSeats[currentRow] : 
                  theaterMap.backSeats[currentRow];
                const remainingInRow = rowSeats.filter(Boolean).length;
                
                // Only move to next row if this one is full
                if (remainingInRow === 0) {
                  currentRow++;
                  // Handle section transition
                  if (currentRow >= (currentSection === 'front' ? frontSection.rows : backSection.rows)) {
                    if (currentSection === 'front') {
                      currentSection = 'back';
                      currentRow = 0;
                    }
                  }
                }
                
                // Handle section transition
                if (currentRow >= (section === 'front' ? frontSection.rows : backSection.rows)) {
                  if (section === 'front') {
                    currentSection = 'back';
                    currentRow = 0;
                  }
                }
              } else {
                throw new Error(`Could not find ${ticket.tickets} seats for group: ${ticket.name}`);
              }
            }
          }
          
          // Update state and storage
          setSeatLabels(newSeatLabels);
          groupColors.clear();
          newGroupColors.forEach((value, key) => {
            groupColors.set(key, value);
          });
          
          // Save to localStorage
          localStorage.setItem('seatLabels', JSON.stringify(newSeatLabels));
          const groupColorsObj = {};
          newGroupColors.forEach((value, key) => {
            groupColorsObj[key] = value;
          });
          localStorage.setItem('groupColors', JSON.stringify(groupColorsObj));
          
          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          alert('Seating chart created!\nGroups have been seated from front to back based on purchase date.');
        } catch (error) {
          console.error('Error processing ticket data:', error);
          alert(`Error processing ticket data: ${error.message}\n\nPlease ensure your CSV file has the following columns:\nname,tickets,purchasedate\n\nAnd follows this format:\nSmith Family,4,2025-09-20`);
        }
      };
      reader.readAsText(file);
    }
  };
  const [currentLabel, setCurrentLabel] = useState('');
  const [mode, setMode] = useState('none'); // 'none', 'labeling', 'clearing', 'seating'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSeat, setDragStartSeat] = useState(null);
  
  // Initialize groupColors from localStorage
  const [groupColors] = useState(() => {
    try {
      const savedColors = localStorage.getItem('groupColors');
      const savedLabels = localStorage.getItem('seatLabels');
      
      if (savedColors && savedLabels) {
        const parsedColors = JSON.parse(savedColors);
        const parsedLabels = JSON.parse(savedLabels);
        const map = new Map();
        
        // Add all saved colors to the map
        Object.entries(parsedColors).forEach(([label, color]) => {
          map.set(label, color);
        });
        
        // Ensure every unique label in seatLabels has a color
        const uniqueLabels = new Set(Object.values(parsedLabels));
        uniqueLabels.forEach(label => {
          if (!map.has(label)) {
            map.set(label, generateColor(map.size));
          }
        });
        
        return map;
      }
      return new Map();
    } catch (error) {
      console.error('Error restoring colors:', error);
      return new Map();
    }
  });
  
  // Initialize satSeats from localStorage
  const [satSeats, setSatSeats] = useState(() => {
    const saved = localStorage.getItem('satSeats');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Add ref for the input field
  const labelInputRef = React.useRef(null);
  
  // Computed state for easier reading
  const isLabeling = mode === 'labeling';
  const isClearing = mode === 'clearing';

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
    } else if (mode === 'seating' && eventType === 'click') {
      // In seating mode, toggle sat status for both labeled and unlabeled seats
      // Only handle actual clicks, not drag events
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

  // Helper to calculate aisle width based on screen size
  const getResponsiveAisleWidth = (baseWidth) => {
    if (window.innerWidth <= 390) {
      return baseWidth * 0.5; // Half width on iPhone 12 and similar
    } else if (window.innerWidth <= 600) {
      return baseWidth * 0.75; // 75% width on other mobile devices
    }
    return baseWidth; // Full width on larger screens
  };

  const renderRow = (rowIndex, seatsPerHalf, aisleWidth, sectionType) => {
    const seatGroups = getSeatGroups();
    const responsiveAisleWidth = getResponsiveAisleWidth(aisleWidth);

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
      <div key={`${sectionType}-${rowIndex}`} style={{ position: 'relative', margin: '8px 0' }}>
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
              // Check if seat is individually marked or part of a sat group
              let isMarkedSat = satSeats.has(seatId);
              let groupSat = false;
              
              // Check if seat is part of a group that's all sat
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
                  {(groupSat || isMarkedSat) && (
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
          <div style={{ display: 'inline-block', width: `${responsiveAisleWidth * 40}px` }} />

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
              // Check if seat is individually marked or part of a sat group
              let isMarkedSat = satSeats.has(seatId);
              let groupSat = false;
              
              // Check if seat is part of a group that's all sat
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
                  {(groupSat || isMarkedSat) && (
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
      <div key="section-divider" style={{ height: '16px' }} />
    );

    // Render back section (6 rows of 12 seats with aisle)
    for (let row = 0; row < backSection.rows; row++) {
      seatArray.push(renderRow(row, backSection.seatsPerHalf, backSection.aisleWidth, 'back'));
    }

    return seatArray;
  };

  // Calculate remaining unseated labeled chairs only
  const remainingUnseated = Object.keys(seatLabels)
    .filter(seatId => !satSeats.has(seatId))
    .length;

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

  const handleScroll = (e) => {
    // Prevent pull-to-refresh behavior
    if (e.target.classList.contains('theater') || e.target.classList.contains('seating-area')) {
      e.stopPropagation();
    }
  };

  // Save seatLabels to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('seatLabels', JSON.stringify(seatLabels));
  }, [seatLabels]);

  // Save groupColors to localStorage whenever it changes
  React.useEffect(() => {
    try {
      // Convert Map to object for storage
      const groupColorsObj = {};
      groupColors.forEach((value, key) => {
        groupColorsObj[key] = value;
      });
      
      // Also check seatLabels to ensure all labels have colors
      const uniqueLabels = new Set(Object.values(seatLabels));
      uniqueLabels.forEach(label => {
        if (!groupColorsObj[label]) {
          const color = generateColor(Object.keys(groupColorsObj).length);
          groupColorsObj[label] = color;
          groupColors.set(label, color);
        }
      });
      
      localStorage.setItem('groupColors', JSON.stringify(groupColorsObj));
    } catch (error) {
      console.error('Error saving colors:', error);
    }
  }, [groupColors, seatLabels]);

  // Save satSeats to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('satSeats', JSON.stringify(Array.from(satSeats)));
  }, [satSeats]);

  React.useEffect(() => {
    // Prevent zoom gestures
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('gesturestart', (e) => e.preventDefault());
      document.removeEventListener('gesturechange', (e) => e.preventDefault());
      document.removeEventListener('gestureend', (e) => e.preventDefault());
    };
  }, []);

  return (
    <div className="theater" onScroll={handleScroll}>
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
          {isLabeling ? 'Stop Making Chart' : 'Make Seating Chart'}
        </button>
        <button
          onClick={() => {
            setMode(mode === 'clearing' ? 'none' : 'clearing');
            setSelectedSeats(new Set());
          }}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: isClearing ? '#007bff' : '#90EE90',
            color: isClearing ? 'white' : 'black',
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
            backgroundColor: mode === 'seating' ? '#007bff' : '#90EE90',
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
            // Clear all state and localStorage
            setSeatLabels({});
            setSelectedSeats(new Set());
            setSatSeats(new Set());
            
            // Clear the Map and force a re-render
            groupColors.clear();
            const event = new Event('storage');
            window.dispatchEvent(event);
            
            setMode('none');
            localStorage.clear(); // Clear all storage related to this app
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Upload Ticket Data
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
        data-mode={mode}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          overflowX: 'auto',
          padding: '0 2vw',
          position: 'relative',

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
