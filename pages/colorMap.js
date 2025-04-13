// Color mapping object with expanded list of common colors
export const colorMap = {
  // Basic Colors
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  
  // Grayscale
  '#808080': 'Gray',
  '#C0C0C0': 'Silver',
  '#D3D3D3': 'Light Gray',
  '#A9A9A9': 'Dark Gray',
  
  // Browns
  '#800000': 'Maroon',
  '#8B4513': 'Saddle Brown',
  '#A52A2A': 'Brown',
  '#D2691E': 'Chocolate',
  '#DEB887': 'Burly Wood',
  
  // Greens
  '#808000': 'Olive',
  '#008000': 'Dark Green',
  '#006400': 'Dark Green',
  '#228B22': 'Forest Green',
  '#32CD32': 'Lime Green',
  '#90EE90': 'Light Green',
  '#98FB98': 'Pale Green',
  
  // Blues
  '#000080': 'Navy',
  '#008080': 'Teal',
  '#4169E1': 'Royal Blue',
  '#1E90FF': 'Dodger Blue',
  '#87CEEB': 'Sky Blue',
  '#B0E0E6': 'Powder Blue',
  
  // Purples
  '#800080': 'Purple',
  '#8B008B': 'Dark Magenta',
  '#9370DB': 'Medium Purple',
  '#BA55D3': 'Medium Orchid',
  '#DDA0DD': 'Plum',
  
  // Reds and Pinks
  '#FF1493': 'Deep Pink',
  '#FF69B4': 'Hot Pink',
  '#FFB6C1': 'Light Pink',
  '#FFA07A': 'Light Salmon',
  '#FF6347': 'Tomato',
  '#DC143C': 'Crimson',
  
  // Oranges and Yellows
  '#FFA500': 'Orange',
  '#FF8C00': 'Dark Orange',
  '#FFD700': 'Gold',
  '#F0E68C': 'Khaki',
  '#BDB76B': 'Dark Khaki',
  
  // Beiges and Creams
  '#F5F5DC': 'Beige',
  '#FFDEAD': 'Navajo White',
  '#FFE4C4': 'Bisque',
  '#FAEBD7': 'Antique White',
  '#FAF0E6': 'Linen'
};

// Function to get the closest color name from hex
export function getClosestColorName(hex) {
  // Convert input hex to uppercase for comparison
  const upperHex = hex.toUpperCase();
  
  // If exact match exists, return it
  if (colorMap[upperHex]) {
    return colorMap[upperHex];
  }
  
  // Default to "Color" if no match found
  return 'Color';
} 