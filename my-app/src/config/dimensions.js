// Base dimensions that scale with screen size
export const BASE_DIMENSIONS = {
  desktop: {
    seatWidth: 24,  // Actual icon size, margins will be added
    fontSize: 11,
    topOffset: -16,
  },
  tablet: {
    seatWidth: 12,  // Actual icon size, margins will be added
    fontSize: 9,
    topOffset: -14,
  },
  mobile: {
    seatWidth: 10,  // Actual icon size, margins will be added
    fontSize: 8,
    topOffset: -12,
  }
};

// Common spacing values
export const SPACING = {
  margin: 8,    // Consistent margin for all screen sizes
  padding: 8,   // Consistent padding for all screen sizes
  aisleMultiplier: {
    front: 2,   // Aisle is 2x seat width in front
    back: 3     // Aisle is 3x seat width in back
  },
  seatsPerHalf: {
    front: 7,
    back: 6
  }
};

// Get dimensions based on screen width
export const getDimensions = () => {
  const width = window.innerWidth;
  const screenType = width <= 390 ? 'mobile' 
                  : width <= 600 ? 'tablet' 
                  : 'desktop';
  
  const base = BASE_DIMENSIONS[screenType];
  
  return {
    seatWidth: base.seatWidth,
    seatMargin: SPACING.margin,
    fontSize: base.fontSize,
    topOffset: base.topOffset,
    aisleWidth: base.seatWidth * SPACING.aisleMultiplier.front,
    labelPadding: SPACING.padding
  };
};
