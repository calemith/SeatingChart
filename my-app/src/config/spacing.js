// Configuration for seat spacing and layout
export const SPACING = {
  // Number of seats in each half-section (left or right of aisle)
  seatsPerHalf: {
    'A': 4,  // Section A has 4 seats on each side
    'B': 6,  // Section B has 6 seats on each side
    'C': 8   // Section C has 8 seats on each side
  },
  
  // Multiplier for aisle width relative to seat width
  // e.g., if seat width is 40px and multiplier is 2, aisle will be 80px
  aisleMultiplier: {
    'A': 1.5,  // Section A has a narrow aisle
    'B': 2,    // Section B has a medium aisle
    'C': 2.5   // Section C has a wide aisle
  }
};
